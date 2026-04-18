# 📚 Document Upload System - Complete Overview

## Documents Required (5 Total)

| # | Document | Required? | Format | Location |
|---|----------|-----------|--------|----------|
| 1 | **Aadhaar Document** | ✅ Optional* | PDF, JPG, PNG | Both fields required |
| 2 | **Student Photo** | ✅ Required | JPG, PNG | Separate folder |
| 3 | **Mark Sheet** | ✅ Required | PDF, JPG, PNG | Separate folder |
| 4 | **Transfer Certificate (TC)** | ✅ Required | PDF, JPG, PNG | Separate folder |
| 5 | **Passport** | ❌ Optional | PDF, JPG, PNG | Separate folder |

*Aadhaar number is required, document is optional

---

## Storage Structure

### Google Drive Folder Organization

```
Admissions_Uploads (Main Folder - Auto-Created)
│
├── JOHN_SMITH_ADM202678907910 (Student Folder - Named with Student Name)
│   ├── Aadhaar_1234567890_1713436200000
│   ├── StudentPhoto_JOHN_SMITH_1713436201000
│   ├── Marksheet_85_1713436202000
│   ├── TransferCertificate_ADM202678907910_1713436203000
│   └── Passport_ADM202678907910_1713436204000 (if uploaded)
│
├── PRIYA_SHARMA_ADM202677890234 (Student Folder - Named with Student Name)
│   ├── Aadhaar_9876543210_1713436300000
│   ├── StudentPhoto_PRIYA_SHARMA_1713436301000
│   ├── Marksheet_92_1713436302000
│   └── TransferCertificate_ADM202677890234_1713436303000
│
└── RAJESH_KUMAR_ADM202676543890 (Student Folder - Named with Student Name)
    ├── Aadhaar_5555555555_1713436400000
    └── ...more documents...
```

### Key Points:
- ✅ Each student gets **ONE folder** named with their name + admission number
- ✅ All 5 document types go into the **same folder**
- ✅ Folders are auto-created when form submitted
- ✅ Files are named with document type + reference + timestamp
- ✅ Easy to browse by student name
- ✅ All documents linked in Google Sheet

---

## Data Stored in Google Sheet

### Admissions Sheet Columns

```
Column  | Data
--------|-------------------------------------------
A       | Submission Time (When form was submitted)
B       | Admission Number (ADM20261234XXXX)
C       | Student Name (JOHN SMITH)
D       | Date of Birth (5/15/2004)
E       | Mobile (9876543210)
F       | Email (john@example.com)
G       | Aadhaar Number (123456789012)
H       | Aadhaar Document (Clickable Link)
I       | Stream (Science/Commerce/Arts)
J       | Section (A/B/C)
K       | Father Name (SMITH)
L       | Mother Name (MARY)
M       | Board (State Board/CBSE/ICSE)
N       | Total Marks (600)
O       | Marks Obtained (510)
P       | Percentage (85.00%)
Q       | Marksheet Document (Clickable Link)
R       | Student Photo (Clickable Link)
S       | Passport (Clickable Link or "Not uploaded")
T       | Transfer Certificate (Clickable Link)
U       | Caste (Category)
V       | Gender (Male/Female)
W       | Result (Pass/Fail/Compartment)
X       | Courses (Physics, Chemistry, Biology)
Y       | Student Folder (Clickable Link to folder)
```

---

## How It Works - Step by Step

### 1️⃣ Student Fills Form
- Enters all personal & academic details
- Uploads 4-5 documents as required
- Submits application

### 2️⃣ Form Validation (Client-Side)
- ✅ Checks all required fields filled
- ✅ Checks required documents uploaded
- ✅ Validates document formats (PDF, JPG, PNG)
- Shows errors if any issue

### 3️⃣ Data Sent to Google Apps Script
- Form data converted to JSON
- Documents converted to file blobs
- All sent in single POST request

### 4️⃣ Backend Processing (Google Apps Script)
- Receives JSON data + files
- Creates student folder: `StudentName_AdmissionNo`
- Saves each document to folder
- Gets shareable URL for each file
- Stores URLs in Google Sheet row
- Creates backup in Archive sheet

### 5️⃣ Data Stored in Two Places
- **Google Sheet**: All form data + document links
- **Google Drive**: Actual documents in student folder
- **Browser Cache**: Backup in localStorage

### 6️⃣ Student Gets Confirmation
- Shows success message with admission number
- Data ready for college review

---

## How Admins Use the System

### View All Applications
1. Open Google Sheet "PUC Admissions 2026"
2. Click "Admissions" sheet tab
3. See all submissions sorted by date

### Review Documents for One Student
1. Click the "Student Folder" link in last column
2. See all 5 documents for that student
3. Open any document to verify
4. Can download for archiving

### Track Progress
1. Use filter to see "Pass"/"Fail" results
2. Sort by percentage to see merit ranking
3. Create pivot table for statistics

### Export Data
1. Select all data
2. File → Download → Excel/PDF
3. Share with management

---

## Document Format & Size Guidelines

### Accepted Formats
- ✅ **Images**: JPG, JPEG, PNG, GIF, WebP
- ✅ **Documents**: PDF
- ❌ **Not Accepted**: Word, Excel, PowerPoint, RAR, ZIP

### File Size Limits
- Max per file: **25 MB**
- Max total per submission: **100 MB**
- Recommended: Keep under 5 MB per file

### Quality Guidelines
- **Photos**: Clear color photo, 4x6 cm
- **Certificates**: Scanned at 300 DPI
- **Aadhaar**: Both sides clear
- **TC/Marksheet**: Full page visible, text readable
- **Passport**: Clear photos of all pages

---

## Troubleshooting Document Uploads

### Problem: "File upload failed"
**Solution:**
1. Check file format (JPG, PNG, PDF only)
2. Check file size (< 25 MB)
3. Try a different file
4. Clear browser cache and try again

### Problem: "Document not appearing in folder"
**Solution:**
1. Check if Apps Script has permission
2. When submitting first time, Google asks for permissions
3. Click "Allow" for Google Drive access
4. Re-submit the form
5. Check Google Drive root folder

### Problem: "Can't download document from link"
**Solution:**
1. Check link is correct (shows URL in sheet)
2. Try opening in incognito/private mode
3. Check Google Drive access permissions
4. Share folder with yourself if needed

### Problem: "Folder name is wrong"
**Solution:**
1. Folder names auto-sanitize special characters
2. Example: "John-Smith!" becomes "John-Smith_ADM..."
3. This is normal and correct

---

## Security & Privacy

### Who Can See Documents?
- **You (Admin)**: Full access ✅
- **Students**: No access (not shared with them) ✅
- **Others**: No access (private to your Google Drive) ✅

### How to Protect Data

**Option 1: Restrict Access**
1. Right-click "Admissions_Uploads" folder
2. Share only with admin emails
3. Set to "Viewer" (not Editor)

**Option 2: Archive Old Data**
1. Move completed admissions to separate folder
2. Example: "Admissions_Uploads_2026_Completed"
3. Limit active folder size

**Option 3: Backup Regularly**
1. Download Google Sheet as Excel weekly
2. Store in secure location
3. Keep version history

---

## Performance Tips

### Speed Up Access
- Delete old documents when admission complete
- Move archived admissions to separate folder
- Limit to 1000 active submissions per folder

### Organize Better
- Create subfolders by stream (Science, Commerce, Arts)
- Create subfolders by admission batch (Jan 2026, April 2026)
- Move completed to Archive monthly

### Monitor Storage
- Google Drive: Unlimited for most accounts
- But: Keep organized for easy searching
- Review storage: Settings → Manage storage

---

## Example Workflow

### Student Submission (5 minutes)
```
1. Student opens index.html
2. Fills Step 1-4: Personal & Academic details
3. Step 5-6: Uploads 4 documents:
   - Aadhaar: aadhaar.pdf
   - Student Photo: myphoto.jpg
   - Marksheet: 12th_marksheet.pdf
   - TC: transfercert.pdf
   - Passport: (skipped - optional)
4. Accepts declaration
5. Submits form
6. Sees: "✓ Application submitted! Your Admission # is ADM202675551234"
```

### Admin Review (2 minutes per student)
```
1. Admin opens Google Sheet
2. Sees new row with student data
3. Clicks "Student Folder" link → Opens Google Drive folder
4. Reviews 4 documents to verify
5. Checks percentage and marks
6. Decides if eligible for chosen stream
7. Can download or print documents
8. Creates merit list using Percentage column
```

---

## Frequently Asked Questions

**Q: Can I re-upload documents?**
A: Yes. Upload same document type again, it creates new file with timestamp.

**Q: How long do documents stay?**
A: Indefinitely, unless you delete from Google Drive.

**Q: Can student see uploaded documents?**
A: No, student only sees confirmation message with admission #.

**Q: How do I share documents with student?**
A: Click file → Share → Add student email → Send

**Q: What if file is too large?**
A: Compress before uploading. Use online tools to compress PDF/image.

**Q: Can I delete wrong document?**
A: Yes. Open student folder in Drive, delete unwanted file.

**Q: Where's the original form file?**
A: Stays in Google Sheet. Documents are separate links in Drive.

---

## Summary

✅ **5 Documents**: Aadhaar, Photo, Marksheet, TC, Passport
✅ **Storage**: Google Drive + Google Sheet
✅ **Organization**: Separate folder per student with their name
✅ **Access**: Instant links in spreadsheet
✅ **Backup**: Auto-created Archive sheet
✅ **Security**: Private to college admin only
✅ **Easy Review**: One click opens all student documents

**Total Setup Time**: ~30 minutes
**Per Submission Time**: Automatic (handled by backend)
**Admin Review Time**: ~2-3 minutes per student

---

**Version**: 2.0 (Multi-Document System)
**Date**: April 17, 2026
**Created for**: Sri Vidyalaya PU College
