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
      childName,
      giftCode, 
      starterAmount, 
      layout,
      giverName,
      targetAge,
      projectedValue
    } = body;

    // Validate required fields
    if (!recipientEmail || !childName || !giftCode || !starterAmount || !giverName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Format currency values
    const starterAmountFormatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(starterAmount / 100);

    const projectedValueFormatted = projectedValue ? new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(projectedValue / 100) : null;

    // Create claim URL with gift code
    const claimUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://mygrowgrid.com'}/claim?code=${giftCode}`;

    // Template data for SendGrid
    const templateData = {
      giver_name: giverName,
      child_name: childName,
      gift_code: giftCode,
      starter_amount_formatted: starterAmountFormatted,
      layout: layout.charAt(0).toUpperCase() + layout.slice(1), // Capitalize first letter
      claim_url: claimUrl,
      target_age: targetAge,
      projected_value_formatted: projectedValueFormatted,
      logo_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://mygrowgrid.com'}/logo.png`,
      support_email: 'support@mygrowgrid.com',
      company_name: 'Grow Grid',
      company_address: 'Investment Platform for Children'
    };

    // SendGrid message with template
    const msg = {
      to: recipientEmail,
      from: 'noreply@mygrowgrid.com',
      templateId: process.env.SENDGRID_GIFT_TEMPLATE_ID || 'your-template-id', // You'll need to add this env var
      dynamicTemplateData: templateData
    } as any; // Type assertion for SendGrid template

    await sgMail.send(msg);

    return NextResponse.json({ 
      success: true, 
      message: 'Gift notification sent successfully' 
    });

  } catch (error) {
    console.error('SendGrid Template Error:', error);
    return NextResponse.json(
      { error: 'Failed to send gift notification' },
      { status: 500 }
    );
  }
}