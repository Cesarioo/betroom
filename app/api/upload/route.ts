import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/hooks/r2';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const pseudonym = formData.get('pseudonym') as string;
    const fileType = formData.get('fileType') as string; // 'profile' or 'bet'
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate filename with pseudonym
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    // Sanitize pseudonym for filename (remove special characters, spaces)
    const sanitizedPseudonym = pseudonym 
      ? pseudonym.toLowerCase().replace(/[^a-z0-9]/g, '-')
      : 'user';
    
    // Determine folder based on file type
    const folder = fileType === 'bet' ? 'bets' : 'profiles';
    const fileName = `${folder}/${sanitizedPseudonym}-${timestamp}.${fileExtension}`;

    // Upload to R2
    const url = await uploadToR2(buffer, fileName, file.type);

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}

