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
        from: `"Payout Pitch" <${process.env.EMAIL_USER}>`,
        to: collaborator.email,
        subject: `🎵 You've been added to "${track.title}" - Review your splits`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #2d1810; color: #f5e6d3; padding: 32px; border-radius: 16px;">
                <h1 style="color: #d4a853; text-align: center;">🎵 Payout Pitch</h1>
                
                <p>Hey <strong>${collaborator.name}</strong>,</p>
                
                <p><strong>${ownerName}</strong> has added you as a collaborator on:</p>
                
                <div style="background: #1a0f0a; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
                    <h2 style="color: #d4a853; margin: 0;">"${track.title}"</h2>
                </div>
                
                <p>Please review and confirm your ownership splits:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${inviteUrl}" style="background: linear-gradient(135deg, #d4a853, #e07b39); color: #2d1810; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                        Review & Agree to Splits
                    </a>
                </div>
                
                <p style="color: #b89f8a; font-size: 14px;">
                    Or copy this link: <br>
                    <a href="${inviteUrl}" style="color: #d4a853;">${inviteUrl}</a>
                </p>
                
                <hr style="border: none; border-top: 1px solid #3d2318; margin: 30px 0;">
                
                <p style="color: #b89f8a; font-size: 12px; text-align: center;">
                    Payout Pitch — No Shady Splits, Just Solid Ownership
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
        from: `"Payout Pitch" <${process.env.EMAIL_USER}>`,
        to: collaborator.email,
        subject: `✅ Agreement Confirmed - "${track.title}"`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #2d1810; color: #f5e6d3; padding: 32px; border-radius: 16px;">
                <h1 style="color: #d4a853; text-align: center;">✅ Agreement Confirmed</h1>
                
                <p>Hey <strong>${collaborator.name}</strong>,</p>
                
                <p>Your agreement to the splits for <strong>"${track.title}"</strong> has been recorded.</p>
                
                <div style="background: #1a0f0a; padding: 20px; border-radius: 12px; margin: 20px 0;">
                    <p><strong>Agreed on:</strong> ${new Date().toLocaleString()}</p>
                </div>
                
                <p>Keep this email for your records.</p>
                
                <hr style="border: none; border-top: 1px solid #3d2318; margin: 30px 0;">
                
                <p style="color: #b89f8a; font-size: 12px; text-align: center;">
                    Payout Pitch — No Shady Splits, Just Solid Ownership
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

module.exports = {
    sendInviteEmail,
    sendAgreementConfirmation
};