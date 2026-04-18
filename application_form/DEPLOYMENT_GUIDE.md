# 🚀 PUC Admission Form - Step-by-Step Deployment Guide

## Before You Start

- ✅ Have a Google account (Gmail or Google Workspace)
- ✅ Have these files ready:
  - `index.html` (the form)
  - `app.js` (form logic)
  - `google-apps-script.js` (backend script)
  - `test-setup.html` (testing tool)
  - `README.md` (documentation)

---

## PHASE 1: Create Google Sheet & Script (10 minutes)

### Step 1.1: Create Google Sheet
```
1. Go to Google Sheets: https://sheets.google.com
2. Click "+ Create" button
3. Click "Blank Spreadsheet"
4. At top left, rename to: "PUC Admissions 2026"
5. Keep this window open
```

✅ **Result**: You now have a Google Sheet ready to receive data

---

### Step 1.2: Create Google Apps Script
```
1. Still in the Google Sheet
2. Click "Tools" menu (top)
3. Click "Apps Script"
4. A new tab/window opens with code editor
5. Delete all default code (select all: Ctrl+A, delete)
6. Go to file: google-apps-script.js
7. Copy ALL the code
8. Paste it into the Apps Script editor
9. Click "Save" button (top left)
10. Name the project: "PUC_Admission_Backend"
11. Click "OK"
```

✅ **Result**: Google Apps Script is created with your backend code

---

### Step 1.3: Deploy as Web App
```
1. Click "Deploy" button (top right of Apps Script)
2. Click "New Deployment"
3. Click gear icon ⚙️ next to "Select type"
4. Choose "Web app"
5. Fill in:
   - Description: "PUC Admission Form Backend"
   - Execute as: [Your Google Account Email]
   - Who has access: "Anyone"
6. Click "Deploy"
7. A popup shows: "New deployment created"
8. You see a URL like:
   https://script.google.com/macros/s/AKfycbw.../exec
9. COPY this entire URL
10. Click "Allow" if Google asks for permissions
```

✅ **Result**: Apps Script is deployed and has a live URL

---

## PHASE 2: Connect Form to Backend (5 minutes)

### Step 2.1: Update app.js with URL
```
1. Open app.js file in your code editor
2. Find line 8: const GOOGLE_APPS_SCRIPT_URL = "..."
3. Replace the URL (keep the variable name!)
4. It should look like:
   const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw.../exec";
5. Save the file (Ctrl+S)
```

✅ **Result**: Form now knows where to send data

---

## PHASE 3: Test Everything Works (10 minutes)

### Step 3.1: Run Test Page
```
1. Open test-setup.html in your browser
2. Paste your Google Apps Script URL into the text box
3. Click "Test URL Format"
   → Should show: ✅ URL format is valid!
4. Click "Test Connection"
   → Should show: ✅ Connection successful!
5. Click "Send Test Submission"
   → Should show: ✅ Test data sent!
```

✅ **Result**: Connection is verified

---

### Step 3.2: Verify Data in Google Sheet
```
1. Go back to Google Sheet tab
2. You might need to refresh (F5)
3. Check if new sheets were created:
   - "Admissions" sheet should exist
   - "Archive" sheet should exist
4. Click "Admissions" tab
5. You should see test data:
   - Admission Number (starts with ADM or TEST)
   - Student Name: "TEST STUDENT"
   - Email: "test@example.com"
   - Other fields populated
6. Check that a folder "Admissions_Uploads" was created
   in your Google Drive
```

✅ **Result**: Data is being stored correctly!

---

### Step 3.3: Test the Real Form
```
1. Open index.html in your browser
2. Fill in the form completely:
   - SATS Number: 987654321
   - Student Name: YOUR NAME (will be UPPERCASE)
   - Mobile: 9876543210 (10 digits)
   - Upload a test image for Aadhaar
   - Upload a test image for Marksheet
3. Go through all 6 steps
4. Accept the declaration
5. Click "Submit Application"
6. Should show: ✓ Application submitted successfully!
   With an Admission Number
7. Check Google Sheet again for new entry
8. Check Google Drive for uploaded files
```

✅ **Result**: Full form submission works!

---

## PHASE 4: Go Live (5 minutes)

### Step 4.1: Share Form with Students
```
1. Copy the link to index.html
   OR
   Upload files to your college website
   Then copy the form URL

2. Share the link via:
   - Email to all students
   - College website announcements
   - WhatsApp groups
   - Social media

3. Email text example:
   ---
   Subject: PUC Admission Form 2026 - Apply Now
   
   Dear Students,
   
   PUC admission form is now open. Please fill and submit
   by [DATE].
   
   Form Link: [LINK TO index.html]
   
   Instructions:
   - Fill all fields carefully
   - Upload clear images of Aadhaar and Marksheet
   - After submission, you'll receive an Admission Number
   - We will contact you with results
   
   Best regards,
   Admissions Office
   ---
```

✅ **Result**: Students can now apply!

---

### Step 4.2: Set Up Admin Access
```
1. Go to Google Sheet
2. Click "Share" (top right)
3. Add email addresses of admins:
   - Principal
   - Admissions Officer
   - Secretary
4. Set permission to "Editor"
5. Click "Share"
6. They get email with link to sheet
7. Now they can view submissions
```

✅ **Result**: Admins can monitor submissions

---

## PHASE 5: Daily Management (Ongoing)

### Check New Applications
```
Daily:
1. Open Google Sheet "PUC Admissions 2026"
2. Click "Admissions" sheet
3. See all new applications
4. Sort by "Submission Time" to see newest first
5. Review documents by clicking links
```

### Create Merit List
```
Every week:
1. Select all data
2. Data menu → Create pivot table
3. Rows: Student Name
4. Values: Percentage (sort descending)
5. Creates automatic ranking
```

### Backup Data
```
Every week:
1. Select all data
2. File → Download → Excel
3. Save: "PUC_Admissions_[DATE].xlsx"
4. Store safely (cloud/email/backup)
```

---

## ⚠️ Common Problems & Solutions

### Problem: "Connection Error" when submitting
**Solution:**
1. Check URL in app.js is correct
2. Verify Apps Script is deployed (not just saved)
3. Check deployment status in Google Apps Script:
   - Click "Deploy" → "Manage deployments"
   - Should show "Web app" type

### Problem: Data not appearing in Google Sheet
**Solution:**
1. Go to Google Apps Script editor
2. Click "Execution" log at bottom
3. Look for recent execution
4. If error, fix code and re-deploy
5. Check sheet names are exactly: "Admissions" and "Archive"

### Problem: Can't upload files
**Solution:**
1. Form asks for Aadhaar and Marksheet documents
2. Must be image (JPG, PNG) or PDF
3. File size under 25MB
4. Google will ask for permission on first submission
5. Click "Allow" when prompted

### Problem: Admission number not generating
**Solution:**
1. SATS number must be digits only
2. Must have at least 1 digit
3. Change SATS number, then click elsewhere
4. Admission number should auto-fill

---

## 📋 Checklist Before Launch

- [ ] Google Sheet created
- [ ] Google Apps Script deployed
- [ ] test-setup.html shows all ✅
- [ ] Test form submission works
- [ ] Data appears in Google Sheet
- [ ] Uploaded files appear in Google Drive
- [ ] Admin emails added to sharing
- [ ] Form link tested in browser
- [ ] Email prepared for students
- [ ] Backup folder set up

---

## 📞 Need Help?

### Check These Files:
- `README.md` - Full documentation
- `test-setup.html` - Testing tool
- `index.html` - The form itself
- `app.js` - Form logic

### Browser Console Debugging:
1. Open form in browser
2. Press F12 (Developer Tools)
3. Click "Console" tab
4. Try to submit form
5. Look for error messages
6. Share these errors with developer

### Google Apps Script Logs:
1. Open Google Apps Script editor
2. Click "Execution log"
3. Look for errors
4. Shows what went wrong

---

## 🎉 Success Indicators

✅ Form opens in browser without errors
✅ Admission number auto-generates when SATS entered
✅ Field validation works (red borders for errors)
✅ After submit, shows success message with admission #
✅ Data appears in Google Sheet within seconds
✅ Files appear in Google Drive folder
✅ Multiple submissions each create new rows
✅ Each submission has unique admission number

---

## 🔐 Important Security Notes

⚠️ **DO NOT**:
- Share Google Apps Script URL in public
- Give "Editor" access to students
- Leave form open indefinitely
- Store sensitive data without backup

✅ **DO**:
- Use HTTPS if sharing form online
- Backup data weekly
- Limit access to admins only
- Monitor submissions daily
- Keep personal info private

---

**Version**: 1.0
**Last Updated**: April 17, 2026
**Created for**: Sri Vidyalaya PU College
