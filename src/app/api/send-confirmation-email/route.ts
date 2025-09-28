import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function POST(request: NextRequest) {
  try {
    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      return NextResponse.json(
        { error: 'SendGrid API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { 
      recipientEmail, 
      recipientName, 
      giftCode, 
      kickstartAmount, 
      boardLayout,
      giverName 
    } = body;

    // Validate required fields
    if (!recipientEmail || !giftCode || !kickstartAmount || !giverName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Email template
    const msg = {
      to: recipientEmail,
      from: 'noreply@mygrowgrid.com', // Your verified sender
      subject: 'Your Grow Grid Gift Order Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #10b981; font-size: 28px; margin: 0;">Grow Grid</h1>
            <h2 style="color: #374151; font-size: 24px; margin-top: 10px;">Your Gift Is On Its Way!</h2>
          </div>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #374151; margin-top: 0;">Order Confirmation</h3>
            <p><strong>Gift Code:</strong> ${giftCode}</p>
            <p><strong>From:</strong> ${giverName}</p>
            <p><strong>Recipient:</strong> ${recipientName || 'Gift Recipient'}</p>
            <p><strong>Board Layout:</strong> ${boardLayout}</p>
            <p><strong>Kick-start Amount:</strong> $${(kickstartAmount / 100).toFixed(2)}</p>
            <p><strong>Estimated Arrival:</strong> 2-3 business days</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <p>Hi ${giverName},</p>
            <p>Thank you for creating a Grow Grid gift! Your order has been confirmed and your gift board will ship within 2 business days.</p>
            <p>The recipient can claim their grid using the gift code: <strong>${giftCode}</strong></p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px;">
              Questions? Contact us at support@mygrowgrid.com
            </p>
          </div>
        </div>
      `,
      text: `
        Grow Grid - Your Gift Is On Its Way!
        
        Order Confirmation:
        Gift Code: ${giftCode}
        From: ${giverName}
        Recipient: ${recipientName || 'Gift Recipient'}
        Board Layout: ${boardLayout}
        Kick-start Amount: $${(kickstartAmount / 100).toFixed(2)}
        Estimated Arrival: 2-3 business days
        
        Hi ${giverName},
        
        Thank you for creating a Grow Grid gift! Your order has been confirmed and your gift board will ship within 2 business days.
        
        The recipient can claim their grid using the gift code: ${giftCode}
        
        Questions? Contact us at support@mygrowgrid.com
      `
    };

    await sgMail.send(msg);

    return NextResponse.json({ 
      success: true, 
      message: 'Confirmation email sent successfully' 
    });

  } catch (error) {
    console.error('SendGrid Error:', error);
    return NextResponse.json(
      { error: 'Failed to send confirmation email' },
      { status: 500 }
    );
  }
}