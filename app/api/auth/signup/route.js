// app/api/auth/signup/route.js (notez le nom 'route.js')
import { signup } from '../../../services/authservices';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { userType, ...userData } = body;
    
    const result = await signup(userType, userData);
    
    if (result.success) {
      return NextResponse.json(result, { status: 201 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Server error during signup' 
    }, { status: 500 });
  }
}