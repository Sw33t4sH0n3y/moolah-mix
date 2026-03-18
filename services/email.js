const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Send invite email
async function sendInviteEmail(collaborator, track, ownerName, inviteToken) {
    const inviteUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/tracks/agree/${inviteToken}`;
    
    const mailOptions = {
        from: `"Moolah M$x" <${process.env.EMAIL_USER}>`,
        to: collaborator.email,
        subject: `🎵 You've been added to "${track.title}" - Review your splits`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #f0f0f0; padding: 32px; border-radius: 16px; border: 1px solid #1a4d2e;">
                <h1 style="color: #ffd700; text-align: center;">💰 Moolah M$x</h1>
                
                <p>Hey <strong>${collaborator.name}</strong>,</p>
                
                <p><strong>${ownerName}</strong> has added you as a collaborator on:</p>
                
                <div style="background: #0d1f12; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center; border: 1px solid #2d8a4e;">
                    <h2 style="color: #ffd700; margin: 0;">"${track.title}"</h2>
                </div>
                
                <p>Please review and confirm your ownership splits:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${inviteUrl}" style="background: linear-gradient(135deg, #c9a227, #ffd700); color: #0a0a0a; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                        Review & Agree to Splits
                    </a>
                </div>
                
                <p style="color: #8b9a8b; font-size: 14px;">
                    Or copy this link: <br>
                    <a href="${inviteUrl}" style="color: #4ade80;">${inviteUrl}</a>
                </p>
                
                <hr style="border: none; border-top: 1px solid #1a4d2e; margin: 30px 0;">
                
                <p style="color: #8b9a8b; font-size: 12px; text-align: center;">
                    💰 Moolah M$x — Stack Your Splits, Secure Your Bag
                </p>
            </div>
        `
    };
    
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.log('Email error:', error);
        return { success: false, error: error.message };
    }
}

// Send agreement confirmation
async function sendAgreementConfirmation(collaborator, track) {
    const mailOptions = {
        from: `"Moolah M$x" <${process.env.EMAIL_USER}>`,
        to: collaborator.email,
        subject: `✅ Agreement Confirmed - "${track.title}"`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #f0f0f0; padding: 32px; border-radius: 16px; border: 1px solid #1a4d2e;">
                <h1 style="color: #4ade80; text-align: center;">✅ Agreement Confirmed</h1>
                
                <p>Hey <strong>${collaborator.name}</strong>,</p>
                
                <p>Your agreement to the splits for <strong style="color: #ffd700;">"${track.title}"</strong> has been recorded.</p>
                
                <div style="background: #0d1f12; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #2d8a4e;">
                    <p style="margin: 0;"><strong style="color: #4ade80;">✓ Agreed on:</strong> ${new Date().toLocaleString()}</p>
                </div>
                
                <p>Keep this email for your records.</p>
                
                <hr style="border: none; border-top: 1px solid #1a4d2e; margin: 30px 0;">
                
                <p style="color: #8b9a8b; font-size: 12px; text-align: center;">
                    💰 Moolah M$x — Stack Your Splits, Secure Your Bag
                </p>
            </div>
        `
    };
    
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Confirmation email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.log('Email error:', error);
        return { success: false, error: error.message };
    }
}

// Send password reset email
async function sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/auth/reset-password/${resetToken}`;
    const appName = process.env.APP_NAME || 'Moolah M$x';
    
    const mailOptions = {
        from: `"${appName}" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `🔐 Reset Your Password - ${appName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #f0f0f0; padding: 32px; border-radius: 16px; border: 1px solid #1a4d2e;">
                <h1 style="color: #ffd700; text-align: center;">🔐 Password Reset</h1>
                
                <p>Hey <strong>${user.displayName || user.username}</strong>,</p>
                
                <p>You requested to reset your password. Click the button below:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background: linear-gradient(135deg, #c9a227, #ffd700); color: #0a0a0a; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                
                <p style="color: #8b9a8b; font-size: 14px;">
                    This link expires in 1 hour.<br><br>
                    If you didn't request this, ignore this email.
                </p>
                
                <hr style="border: none; border-top: 1px solid #1a4d2e; margin: 30px 0;">
                
                <p style="color: #8b9a8b; font-size: 12px; text-align: center;">
                    💰 ${appName} — Stack Your Splits, Secure Your Bag
                </p>
            </div>
        `
    };
    
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Reset email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.log('Email error:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendInviteEmail,
    sendAgreementConfirmation,
    sendPasswordResetEmail  
};