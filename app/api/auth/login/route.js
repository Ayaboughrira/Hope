// app/api/auth/login/route.js (notez le nom 'route.js')
import { login } from '../../../services/authservices';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    const result = await login(email, password);
    
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 401 });
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Server error during login' 
    }, { status: 500 });
  }
}