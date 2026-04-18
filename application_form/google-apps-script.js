// Google Apps Script - Complete File & Data Management
// Deploy as Web App with "Execute as: Your Account, Who has access: Anyone"

function doPost(e) {
    try {
        // Parse form data
        let formDataJson = '';
        if (e.postData) {
            formDataJson = e.postData.contents;
        }

        if (!formDataJson) {
            throw new Error('Empty request body');
        }
        
        const data = JSON.parse(formDataJson);
        
        // Get spreadsheet
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        let sheet = ss.getSheetByName('Admissions');
        
        if (!sheet) {
            sheet = ss.insertSheet('Admissions');
            createHeaders(sheet);
        }
        
        // Process all uploaded files
        const studentFolder = createStudentFolder(data.studentName, data.admissionNo);
        
        const documentUrls = {
            aadhaarUrl: 'Not uploaded',
            marksheetUrl: 'Not uploaded',
            photoUrl: 'Not uploaded',
            tcUrl: 'Not uploaded'
        };
        
        // Handle files from base64 data
        if (data.files) {
            // Handle Aadhaar
            if (data.files.aadhaarDocument) {
                try {
                    const blob = Utilities.newBlob(
                        Utilities.base64Decode(data.files.aadhaarDocument.data),
                        data.files.aadhaarDocument.type || 'application/octet-stream',
                        'Aadhaar_' + data.aadhaar + getFileExtension(data.files.aadhaarDocument.name)
                    );
                    documentUrls.aadhaarUrl = saveFileToFolder(studentFolder, blob, 'Aadhaar', data.aadhaar);
                } catch (err) { Logger.log('Aadhaar error: ' + err); }
            }
            
            // Handle Marksheet
            if (data.files.marksheet) {
                try {
                    const blob = Utilities.newBlob(
                        Utilities.base64Decode(data.files.marksheet.data),
                        data.files.marksheet.type || 'application/octet-stream',
                        'Marksheet_' + data.percentage + getFileExtension(data.files.marksheet.name)
                    );
                    documentUrls.marksheetUrl = saveFileToFolder(studentFolder, blob, 'Marksheet', data.percentage);
                } catch (err) { Logger.log('Marksheet error: ' + err); }
            }
            
            // Handle Student Photo
            if (data.files.studentPhoto) {
                try {
                    const blob = Utilities.newBlob(
                        Utilities.base64Decode(data.files.studentPhoto.data),
                        data.files.studentPhoto.type || 'application/octet-stream',
                        'StudentPhoto_' + data.studentName + getFileExtension(data.files.studentPhoto.name)
                    );
                    documentUrls.photoUrl = saveFileToFolder(studentFolder, blob, 'StudentPhoto', data.studentName);
                } catch (err) { Logger.log('Photo error: ' + err); }
            }
            
            // Handle Transfer Certificate
            if (data.files.transferCertificate) {
                try {
                    const blob = Utilities.newBlob(
                        Utilities.base64Decode(data.files.transferCertificate.data),
                        data.files.transferCertificate.type || 'application/octet-stream',
                        'TC_' + data.admissionNo + getFileExtension(data.files.transferCertificate.name)
                    );
                    documentUrls.tcUrl = saveFileToFolder(studentFolder, blob, 'TransferCertificate', data.admissionNo);
                } catch (err) { Logger.log('TC error: ' + err); }
            }
        }
        
        // Prepare row for Google Sheet
        const row = [
            new Date().toLocaleString(),           // Submission Time
            data.admissionNo,                      // Admission Number
            data.studentName,                      // Student Name
            data.dob,                              // DOB
            data.mobile,                           // Mobile
            data.email,                            // Email
            data.aadhaar,                          // Aadhaar Number
            documentUrls.aadhaarUrl,               // Aadhaar Document
            data.stream,                           // Stream
            data.section,                          // Section
            data.fatherName,                       // Father Name
            data.motherName,                       // Mother Name
            data.board,                            // Board
            data.totalMarks,                       // Total Marks
            data.marksObtained,                    // Marks Obtained
            data.percentage,                       // Percentage
            documentUrls.marksheetUrl,             // Marksheet Document
            documentUrls.photoUrl,                 // Student Photo
            documentUrls.tcUrl,                    // Transfer Certificate
            data.caste,                            // Caste
            data.gender,                           // Gender
            data.result,                           // Result
            data.courses,                          // Courses
            // SSLC Subject Marks
            data.lang1Name,                        // 1st Language Name
            data.lang1Marks,                       // 1st Language Marks
            data.lang2Name,                        // 2nd Language Name
            data.lang2Marks,                       // 2nd Language Marks
            data.lang3Name,                        // 3rd Language Name
            data.lang3Marks,                       // 3rd Language Marks
            data.mathMarks,                        // Mathematics Marks
            data.scienceMarks,                     // Science Marks
            data.socialScienceMarks,               // Social Science Marks
            studentFolder.getUrl()                 // Student Folder URL
        ];
        
        // Append to sheet
        sheet.appendRow(row);
        
        // Also log to archive
        let archiveSheet = ss.getSheetByName('Archive');
        if (!archiveSheet) {
            archiveSheet = ss.insertSheet('Archive');
            createHeaders(archiveSheet);
        }
        archiveSheet.appendRow(row);
        
        const attachments = buildEmailAttachments(data);
        
        // Export current admissions sheet to Excel
        try {
            const fileName = 'Admissions_' + new Date().toLocaleString().replace(/[\/\:]/g, '-') + '.xlsx';
            const spreadsheetId = ss.getId();
            const sheetId = sheet.getSheetId();
            const url = 'https://docs.google.com/spreadsheets/d/' + spreadsheetId + '/export?format=xlsx&gid=' + sheetId;
            
            // We'll mention the export in email instead since attachment requires downloading the file
        } catch (err) { Logger.log('Sheet export error: ' + err); }
        
        // Send email notifications with attachments
        sendSubmissionEmails(data, documentUrls, studentFolder, attachments);
        
        // Return success
        return ContentService
            .createTextOutput(JSON.stringify({
                status: 'success',
                message: 'Application submitted successfully',
                admissionNo: data.admissionNo,
                studentName: data.studentName,
                folderUrl: studentFolder.getUrl(),
                timestamp: new Date().toLocaleString()
            }))
            .setMimeType(ContentService.MimeType.JSON);
            
    } catch (error) {
        Logger.log('Error: ' + error.toString());
        return ContentService
            .createTextOutput(JSON.stringify({
                status: 'error',
                message: error.toString()
            }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

function createStudentFolder(studentName, admissionNo) {
    try {
        // Ensure student name is valid for folder
        const safeName = sanitizeFolderName(studentName);
        const folderName = safeName + '_' + admissionNo;
        
        // Get root folder
        const rootFolder = DriveApp.getRootFolder();
        
        // Find or create main uploads folder
        let uploadsFolder = null;
        const uploadsFolders = rootFolder.getFoldersByName('Admissions_Uploads');
        
        if (uploadsFolders.hasNext()) {
            uploadsFolder = uploadsFolders.next();
        } else {
            uploadsFolder = rootFolder.createFolder('Admissions_Uploads');
        }
        
        // Create student folder
        let studentFolder = null;
        const studentFolders = uploadsFolder.getFoldersByName(folderName);
        
        if (studentFolders.hasNext()) {
            studentFolder = studentFolders.next();
        } else {
            studentFolder = uploadsFolder.createFolder(folderName);
            // Share folder
            studentFolder.setSharing(DriveApp.Access.READER, DriveApp.Permission.ANYONE);
        }
        
        return studentFolder;
    } catch (error) {
        Logger.log('Error creating folder: ' + error);
        throw error;
    }
}

function saveFileToFolder(folder, blob, docType, reference) {
    try {
        // Create filename
        const timestamp = new Date().getTime();
        const existingName = blob.getName();
        const extension = getFileExtension(existingName);
        const fileName = docType + '_' + sanitizeFolderName(reference || 'Document') + '_' + timestamp + extension;
        
        // Save file
        const file = folder.createFile(blob);
        file.setName(fileName);
        file.setSharing(DriveApp.Access.READER, DriveApp.Permission.ANYONE);
        
        return file.getUrl();
    } catch (error) {
        Logger.log('Error saving file: ' + error);
        return 'Error: ' + error.toString();
    }
}

function sanitizeFolderName(name) {
    // Remove invalid folder name characters
    return name.toString()
        .replace(/[^a-zA-Z0-9\s-]/g, '')  // Keep only alphanumeric, spaces, hyphens
        .replace(/\s+/g, '_')              // Replace spaces with underscores
        .substring(0, 50)                   // Limit length
        .trim();
}

function getFileExtension(fileName) {
    if (!fileName || fileName.indexOf('.') === -1) {
        return '';
    }

    return '.' + fileName.toString().split('.').pop().toLowerCase();
}

function buildEmailAttachments(data) {
    const attachments = [];

    if (!data.files) {
        return attachments;
    }

    Object.keys(data.files).forEach(function(key) {
        const fileInfo = data.files[key];
        if (!fileInfo || !fileInfo.data) {
            return;
        }

        try {
            attachments.push(
                Utilities.newBlob(
                    Utilities.base64Decode(fileInfo.data),
                    fileInfo.type || 'application/octet-stream',
                    fileInfo.name || (key + getFileExtension(fileInfo.name))
                )
            );
        } catch (err) {
            Logger.log('Attachment error for ' + key + ': ' + err);
        }
    });

    return attachments;
}

function createHeaders(sheet) {
    const headers = [
        'Submission Time',
        'Admission Number',
        'Student Name',
        'Date of Birth',
        'Mobile',
        'Email',
        'Aadhaar Number',
        'Aadhaar Document',
        'Stream',
        'Section',
        'Father Name',
        'Mother Name',
        'Board',
        'Total Marks',
        'Marks Obtained',
        'Percentage',
        'Marksheet Document',
        'Student Photo',
        'Transfer Certificate',
        'Caste',
        'Gender',
        'Result',
        'Courses',
        '1st Language',
        '1st Language Marks (125)',
        '2nd Language',
        '2nd Language Marks (125)',
        '3rd Language',
        '3rd Language Marks (125)',
        'Mathematics Marks (100)',
        'Science Marks (100)',
        'Social Science Marks (100)',
        'Student Folder'
    ];
    
    sheet.appendRow(headers);
    
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#667eea');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    
    sheet.setFrozenRows(1);
    
    for (let i = 1; i <= headers.length; i++) {
        sheet.autoResizeColumn(i);
    }
}

// Send email notifications to admin and student
function sendSubmissionEmails(data, documentUrls, studentFolder, attachments) {
    const ADMIN_EMAIL = 'ASK@svpucollege.org';
    const studentEmail = data.email;
    const studentName = data.studentName;
    const admissionNo = data.admissionNo;
    
    try {
        // Email body for admin with full details
        const adminEmailBody = `
        <h2>PUC Admission Form Submission</h2>
        <hr>
        <h3>Student Information</h3>
        <p><b>Admission Number:</b> ${admissionNo}</p>
        <p><b>Student Name:</b> ${studentName}</p>
        <p><b>Date of Birth:</b> ${data.dob}</p>
        <p><b>Mobile:</b> ${data.mobile}</p>
        <p><b>Email:</b> ${data.email}</p>
        <p><b>Aadhaar Number:</b> ${data.aadhaar}</p>
        
        <h3>Academic Information</h3>
        <p><b>Stream:</b> ${data.stream}</p>
        <p><b>Section:</b> ${data.section}</p>
        <p><b>Board:</b> ${data.board}</p>
        <p><b>Total Marks:</b> ${data.totalMarks}</p>
        <p><b>Marks Obtained:</b> ${data.marksObtained}</p>
        <p><b>Percentage:</b> ${data.percentage}%</p>
        <p><b>Result:</b> ${data.result}</p>
        
        <h3>SSLC Subject Marks</h3>
        <p><b>${data.lang1Name}:</b> ${data.lang1Marks}/125</p>
        <p><b>${data.lang2Name}:</b> ${data.lang2Marks}/125</p>
        <p><b>${data.lang3Name}:</b> ${data.lang3Marks}/125</p>
        <p><b>Mathematics:</b> ${data.mathMarks}/100</p>
        <p><b>Science:</b> ${data.scienceMarks}/100</p>
        <p><b>Social Science:</b> ${data.socialScienceMarks}/100</p>
        
        <h3>Family Details</h3>
        <p><b>Father Name:</b> ${data.fatherName}</p>
        <p><b>Mother Name:</b> ${data.motherName}</p>
        <p><b>Gender:</b> ${data.gender}</p>
        <p><b>Caste:</b> ${data.caste}</p>
        
        <h3>Documents Status</h3>
        <p><b>Aadhaar Document:</b> ${documentUrls.aadhaarUrl !== 'Not uploaded' ? '✓ Uploaded' : '⚠ Not uploaded'}</p>
        <p><b>Student Photo:</b> ${documentUrls.photoUrl !== 'Not uploaded' ? '✓ Uploaded' : '⚠ Not uploaded'}</p>
        <p><b>Marksheet:</b> ${documentUrls.marksheetUrl !== 'Not uploaded' ? '✓ Uploaded' : '⚠ Not uploaded'}</p>
        <p><b>Transfer Certificate:</b> ${documentUrls.tcUrl !== 'Not uploaded' ? '✓ Uploaded' : '⚠ Not uploaded'}</p>
        
        <h3>Submission Details</h3>
        <p><b>Submitted:</b> ${new Date().toLocaleString()}</p>
        <p><b>Documents Folder:</b> <a href="${studentFolder.getUrl()}">${studentFolder.getName()}</a></p>
        <p><b>Student Folder:</b> <a href="${studentFolder.getUrl()}">${studentFolder.getUrl()}</a></p>
        <p><b>Aadhaar File:</b> ${documentUrls.aadhaarUrl}</p>
        <p><b>Marksheet File:</b> ${documentUrls.marksheetUrl}</p>
        <p><b>Photo File:</b> ${documentUrls.photoUrl}</p>
        <p><b>Transfer Certificate File:</b> ${documentUrls.tcUrl}</p>
        `;
        
        // Prepare email options with attachments
        const mailOptions = {
            htmlBody: adminEmailBody,
            attachments: attachments && attachments.length > 0 ? attachments : []
        };
        
        // Send to Admin with attachments
        MailApp.sendEmail(
            ADMIN_EMAIL,
            '✓ New PUC Admission: ' + studentName + ' (' + admissionNo + ')',
            '',
            mailOptions
        );
        
        // Confirmation email for student/parent
        const studentEmailBody = `
        <h2>PUC Admission Form - Submission Confirmation</h2>
        <hr>
        <p>Dear ${studentName},</p>
        <p>Your PUC admission application has been <b>successfully submitted</b>!</p>
        
        <h3>Your Submission Details</h3>
        <p><b>Admission Number:</b> <span style="color: #667eea; font-weight: bold; font-size: 16px;">${admissionNo}</span></p>
        <p><b>Stream:</b> ${data.stream}</p>
        <p><b>Section:</b> ${data.section}</p>
        <p><b>Percentage:</b> ${data.percentage}%</p>
        <p><b>Submitted on:</b> ${new Date().toLocaleString()}</p>
        
        <h3>SSLC Subject Marks</h3>
        <ul>
            <li><b>${data.lang1Name}:</b> ${data.lang1Marks}/125</li>
            <li><b>${data.lang2Name}:</b> ${data.lang2Marks}/125</li>
            <li><b>${data.lang3Name}:</b> ${data.lang3Marks}/125</li>
            <li><b>Mathematics:</b> ${data.mathMarks}/100</li>
            <li><b>Science:</b> ${data.scienceMarks}/100</li>
            <li><b>Social Science:</b> ${data.socialScienceMarks}/100</li>
        </ul>
        
        <h3>Documents Status</h3>
        <ul>
            <li>Aadhaar Document: ${documentUrls.aadhaarUrl !== 'Not uploaded' ? '✓ Received' : '⚠ Not uploaded'}</li>
            <li>Student Photo: ${documentUrls.photoUrl !== 'Not uploaded' ? '✓ Received' : '⚠ Not uploaded'}</li>
            <li>Marksheet: ${documentUrls.marksheetUrl !== 'Not uploaded' ? '✓ Received' : '⚠ Not uploaded'}</li>
            <li>Transfer Certificate: ${documentUrls.tcUrl !== 'Not uploaded' ? '✓ Received' : '⚠ Not uploaded'}</li>
        </ul>
        
        <h3>Document Storage</h3>
        <p>All your documents have been securely saved in the college's Google Drive in a dedicated folder for your admission: <b>${studentFolder.getName()}</b></p>
        <p>Your documents are also being shared with the admissions office for processing.</p>
        
        <p>Please keep your admission number <b>${admissionNo}</b> for future reference.</p>
        <p>If you have any questions or need to update your information, please contact the admissions office.</p>
        
        <hr>
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply directly.</p>
        `;
        
        // Send confirmation to student
        if (studentEmail) {
            MailApp.sendEmail(
                studentEmail,
                '✓ Admission Form Submitted Successfully - Admission #' + admissionNo,
                '',
                { htmlBody: studentEmailBody }
            );
        }
        
        Logger.log('Emails sent successfully to admin and student');
    } catch (error) {
        Logger.log('Error sending emails: ' + error.toString());
    }
}

// Helper function to get all submissions
function getAllSubmissions() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Admissions');
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    return data.slice(1);
}

// Helper function to get specific admission by number
function getAdmission(admissionNo) {
    const submissions = getAllSubmissions();
    return submissions.find(row => row[1] === admissionNo);
}

// Helper function to get student folder
function getStudentFolder(studentName, admissionNo) {
    const safeName = sanitizeFolderName(studentName);
    const folderName = safeName + '_' + admissionNo;
    
    const rootFolder = DriveApp.getRootFolder();
    const uploadsFolders = rootFolder.getFoldersByName('Admissions_Uploads');
    
    if (uploadsFolders.hasNext()) {
        const uploadsFolder = uploadsFolders.next();
        const studentFolders = uploadsFolder.getFoldersByName(folderName);
        if (studentFolders.hasNext()) {
            return studentFolders.next();
        }
    }
    return null;
}

// Function to update admission status
function updateAdmissionStatus(admissionNo, status) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Admissions');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
        if (data[i][1] === admissionNo) {
            // Add status column if doesn't exist
            sheet.getRange(i + 1, data[0].length + 1).setValue(status);
            return true;
        }
    }
    return false;
}

// Test function - run this to verify deployment
function doGet(e) {
    return HtmlService.createHtmlOutput('✓ Google Apps Script is deployed correctly!<br>Form submissions will be received here.');
}
