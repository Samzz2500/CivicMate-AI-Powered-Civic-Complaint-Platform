# Email Setup Guide for Forgot Password Feature

## Gmail Setup (Recommended)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account: https://myaccount.google.com/
2. Click on "Security" in the left sidebar
3. Under "Signing in to Google", enable "2-Step Verification"

### Step 2: Generate App Password
1. After enabling 2FA, go back to Security settings
2. Under "Signing in to Google", click on "App passwords"
3. Select "Mail" as the app and "Other" as the device
4. Name it "CivicMate" or any name you prefer
5. Click "Generate"
6. Copy the 16-character password (it will look like: xxxx xxxx xxxx xxxx)

### Step 3: Update .env File
Open `backend/.env` and update:
```
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
```
(Replace with your actual email and the app password you generated)

## Alternative: Using Other Email Services

### Outlook/Hotmail
```javascript
service: "hotmail"
```

### Yahoo
```javascript
service: "yahoo"
```

### Custom SMTP
```javascript
host: "smtp.yourdomain.com",
port: 587,
secure: false,
auth: {
  user: "your-email@yourdomain.com",
  pass: "your-password"
}
```

## Testing the Feature

1. Start the backend server
2. Go to login page and click "Forgot Password?"
3. Enter your registered email
4. Complete the captcha
5. Check your email inbox for the reset link
6. Click the link or copy it to browser
7. Enter new password and confirm
8. Login with new password

## Troubleshooting

### Email not sending?
- Check if EMAIL_USER and EMAIL_PASS are correctly set in .env
- Verify 2FA is enabled and app password is generated
- Check backend console for error messages
- Make sure nodemailer is installed: `npm install nodemailer`

### Reset link expired?
- Links expire after 1 hour for security
- Request a new reset link

### Still having issues?
- Check spam/junk folder
- Try using a different email service
- Verify your email is registered in the system
