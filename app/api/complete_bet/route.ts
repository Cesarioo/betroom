import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type Decision = 'yes' | 'no';

export async function POST(request: Request) {
  try {
    const { bet_id, admin_user_id, decision } = (await request.json()) as {
      bet_id?: string;
      admin_user_id?: string;
      decision?: Decision;
    };

    if (!bet_id || !admin_user_id || (decision !== 'yes' && decision !== 'no')) {
      return NextResponse.json(
        { error: 'bet_id, admin_user_id and decision (yes|no) are required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase env vars missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1) Validate the admin is a participant with is_admin=true for this bet
    const { data: participant, error: participantError } = await supabase
      .from('bet_participants')
      .select('user_id, is_admin')
      .eq('bet_id', bet_id)
      .eq('user_id', admin_user_id)
      .eq('is_admin', true)
      .single();

    if (participantError || !participant) {
      return NextResponse.json(
        { error: 'User is not an admin for this bet' },
        { status: 403 }
      );
    }

    // 2) Record this admin's decision on bet_participants (admin_decision boolean)
    const adminDecision = decision === 'yes';
    const { error: decisionError } = await supabase
      .from('bet_participants')
      .update({ admin_decision: adminDecision })
      .eq('bet_id', bet_id)
      .eq('user_id', admin_user_id)
      .eq('is_admin', true);

    if (decisionError) {
      return NextResponse.json(
        { error: 'Failed to record admin decision', details: decisionError.message },
        { status: 500 }
      );
    }

    // 3) Check if all admins have decided
    const { data: admins, error: adminsError } = await supabase
      .from('bet_participants')
      .select('user_id, admin_decision, is_admin')
      .eq('bet_id', bet_id)
      .eq('is_admin', true);

    if (adminsError) {
      return NextResponse.json(
        { error: 'Failed to fetch admins', details: adminsError.message },
        { status: 500 }
      );
    }

    type AdminRow = { user_id: string; admin_decision: boolean | null; is_admin: boolean };
    const adminRows: AdminRow[] = (admins as AdminRow[]) || [];
    const pending = adminRows.some((a) => a.admin_decision === null || a.admin_decision === undefined);
    if (pending) {
      return NextResponse.json({ success: true, pending: true });
    }

    // All decided; ensure unanimity
    const first = adminRows.length > 0 ? adminRows[0].admin_decision : null;
    const unanimous = adminRows.every((a) => a.admin_decision === first);
    if (!unanimous || first === null) {
      return NextResponse.json(
        { error: 'Admins decisions are not unanimous; cannot resolve' },
        { status: 409 }
      );
    }

    const resolvedOutcome = first ? 'yes' : 'no';

    // 4) Mark bet resolved with outcome
    const { error: updateError } = await supabase
      .from('bets')
      .update({
        is_resolved: true,
        resolved_outcome: resolvedOutcome,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', bet_id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to resolve bet', details: updateError.message },
        { status: 500 }
      );
    }

    // 5) Compute transfers from trades for settlement
    const { data: allTrades, error: tradesError } = await supabase
      .from('trades')
      .select('id, bet_id, user_id, side, price, amount, maker_trade_id')
      .eq('bet_id', bet_id);

    if (tradesError) {
      return NextResponse.json(
        { error: 'Failed to fetch trades', details: tradesError.message },
        { status: 500 }
      );
    }

    type Trade = { id: string; bet_id: string; user_id: string; side: 'yes' | 'no'; price: number; amount: number; maker_trade_id: string | null };
    const makers: Trade[] = (allTrades || []).filter(t => t.maker_trade_id === null) as Trade[];
    const takersByMaker = new Map<string, Trade[]>();
    (allTrades || []).filter(t => t.maker_trade_id !== null).forEach((t) => {
      const trade = t as Trade;
      const list = takersByMaker.get(trade.maker_trade_id!) || [];
      list.push(trade);
      takersByMaker.set(trade.maker_trade_id!, list);
    });

    type Transfer = { from_user_id: string; to_user_id: string; amount: number; maker_trade_id: string };
    const transfers: Transfer[] = [];

    const outcomeYes = resolvedOutcome === 'yes';

    for (const maker of makers) {
      const takers = takersByMaker.get(maker.id) || [];
      if (takers.length === 0) continue;

      const p = maker.price; // 0..100
      const M = maker.amount;
      if (p <= 0 || p >= 100) {
        // Avoid division by zero; if p=0 or 100, only opposite or same side can ever win deterministically
        const makerWins = (maker.side === 'yes' && outcomeYes) || (maker.side === 'no' && !outcomeYes);
        if (makerWins) {
          // Opposite side pays everything they provided
          for (const t of takers) {
            const share = t.amount; // all to maker
            if (share > 0) transfers.push({ from_user_id: t.user_id, to_user_id: maker.user_id, amount: share, maker_trade_id: maker.id });
          }
        } else {
          // Maker pays up to M to opposite side proportionally to their amounts
          const totalOpp = takers.reduce((s, t) => s + t.amount, 0);
          if (totalOpp > 0) {
            for (const t of takers) {
              const portion = (t.amount / totalOpp) * M;
              if (portion > 0) transfers.push({ from_user_id: maker.user_id, to_user_id: t.user_id, amount: portion, maker_trade_id: maker.id });
            }
          }
        }
        continue;
      }

      const makerYes = maker.side === 'yes';
      // Required opposite allocation for a fully matched position
      const requiredOpp = makerYes ? (M * (100 - p)) / p : (M * p) / (100 - p);
      const totalOpp = takers.reduce((s, t) => s + t.amount, 0);
      const settledOpp = Math.min(requiredOpp, totalOpp);

      if ((makerYes && outcomeYes) || (!makerYes && !outcomeYes)) {
        // Maker's side wins: maker receives from opposite side up to settledOpp
        // Distribute from each taker proportional to their amount
        const denom = totalOpp || 1;
        for (const t of takers) {
          const fromTaker = (t.amount / denom) * settledOpp;
          if (fromTaker > 0) transfers.push({ from_user_id: t.user_id, to_user_id: maker.user_id, amount: fromTaker, maker_trade_id: maker.id });
        }
      } else {
        // Opposite side wins: takers receive from maker up to maker's stake proportional to their relative claim
        // Maker pays proportional to takers' amounts with cap determined by conversion back to maker stake
        // Convert settledOpp back to maker stake value paid
        const makerPays = makerYes ? (settledOpp * p) / (100 - p) : (settledOpp * (100 - p)) / p;
        const denom = totalOpp || 1;
        for (const t of takers) {
          const toTaker = (t.amount / denom) * makerPays;
          if (toTaker > 0) transfers.push({ from_user_id: maker.user_id, to_user_id: t.user_id, amount: toTaker, maker_trade_id: maker.id });
        }
      }
    }

    // 6) Persist transfers into money_movement as credit/debit entries
    // Schema expected: { type: 'credit'|'debit', amount: number, user_id: string, source: 'trade', reference: string }
    const moneyRows = transfers.flatMap(t => {
      const refBase = `${bet_id}:${t.maker_trade_id}:${t.from_user_id}->${t.to_user_id}`;
      return [
        {
          type: 'debit',
          amount: t.amount,
          user_id: t.from_user_id,
          source: 'trade',
          reference: `${refBase}:debit`,
        },
        {
          type: 'credit',
          amount: t.amount,
          user_id: t.to_user_id,
          source: 'trade',
          reference: `${refBase}:credit`,
        },
      ];
    });

    const filteredMoneyRows = moneyRows.filter(r => r.amount > 0);
    // Deduplicate by (source, reference) to prevent ON CONFLICT same-row twice in one batch
    const uniqueByKey = new Map<string, typeof filteredMoneyRows[number]>();
    for (const row of filteredMoneyRows) {
      const key = `${row.source}|${row.reference}`;
      if (!uniqueByKey.has(key)) uniqueByKey.set(key, row);
    }
    const uniqueRows = Array.from(uniqueByKey.values());
    if (uniqueRows.length > 0) {
      const { error: moneyError } = await supabase
        .from('money_movement')
        .upsert(uniqueRows, { onConflict: 'source,reference' });
      if (moneyError) {
        return NextResponse.json(
          { error: 'Failed to write money movements', details: moneyError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, resolved_outcome: resolvedOutcome, transfers, money_movements_written: uniqueRows.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


