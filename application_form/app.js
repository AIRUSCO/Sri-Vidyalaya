// Global variables
let currentStep = 0;
let totalSteps = 0;
let formData = {};

// Google Apps Script deployment URL - Replace with your own
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby6-XHGIZvVUN0HUNpwnu7dj2fncPLtZesz32H37kgSYqqOeLwylTwyrydWj1WFTNUVCw/exec";

// Initialize form
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    setupEventListeners();
});

function initializeForm() {
    totalSteps = document.querySelectorAll('.step').length;

    // Auto-generate admission number when SATS number changes
    document.getElementById('satsNo').addEventListener('change', generateAdmissionNumber);
    
    // Auto-format mobile number
    document.getElementById('mobile').addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);
    });
    
    // Auto-format Aadhaar
    document.getElementById('aadhaar').addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '').slice(0, 12);
    });
    
    // Force capital letters for student name
    document.getElementById('studentName').addEventListener('input', function() {
        this.value = this.value.toUpperCase().replace(/[^A-Z\s]/g, '');
    });
    
    // Calculate percentage
    document.getElementById('marksObtained').addEventListener('change', calculatePercentage);
    document.getElementById('totalMarks').addEventListener('change', calculatePercentage);
    
    // SSLC Subject Marks validation and auto-calculate CBSE percentage
    const sslcMarksFields = ['lang1Marks', 'lang2Marks', 'lang3Marks', 'mathMarks', 'scienceMarks', 'socialScienceMarks'];
    sslcMarksFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('blur', function() {
                validateField(field);
                calculateCBSEPercentage();
            });
            field.addEventListener('input', function() {
                const max = field.max || 100;
                const value = parseFloat(field.value);
                if (value > max) field.value = max;
            });
            field.addEventListener('change', calculateCBSEPercentage);
        }
    });
    
    // Form submission
    document.getElementById('admissionForm').addEventListener('submit', submitForm);
    
    showStep(0);
}

function generateAdmissionNumber() {
    const satsNo = document.getElementById('satsNo').value.trim();
    
    if (!satsNo || !/^[0-9]+$/.test(satsNo)) {
        document.getElementById('admissionNo').value = '';
        return;
    }
    
    // Generate admission number: ADM-YEAR-SATS-RANDOM
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const admissionNo = `ADM${year}${satsNo.slice(-4)}${random}`;
    
    document.getElementById('admissionNo').value = admissionNo;
}

function calculatePercentage() {
    const obtained = parseFloat(document.getElementById('marksObtained').value) || 0;
    const total = parseFloat(document.getElementById('totalMarks').value) || 0;
    
    if (total > 0) {
        const percentage = ((obtained / total) * 100).toFixed(2);
        document.getElementById('percentage').value = percentage;
    }
}

// Calculate CBSE percentage from SSLC subject marks
function calculateCBSEPercentage() {
    // Get all SSLC subject marks
    const lang1 = parseFloat(document.getElementById('lang1Marks').value) || 0;
    const lang2 = parseFloat(document.getElementById('lang2Marks').value) || 0;
    const lang3 = parseFloat(document.getElementById('lang3Marks').value) || 0;
    const math = parseFloat(document.getElementById('mathMarks').value) || 0;
    const science = parseFloat(document.getElementById('scienceMarks').value) || 0;
    const socialScience = parseFloat(document.getElementById('socialScienceMarks').value) || 0;
    
    // Total marks: 125 + 100 + 100 + 100 + 100 + 100 = 625
    const totalMarks = 625;
    const obtainedMarks = lang1 + lang2 + lang3 + math + science + socialScience;
    
    // Calculate percentage
    if (obtainedMarks > 0) {
        const percentage = ((obtainedMarks / totalMarks) * 100).toFixed(2);
        // Set the total and marks obtained fields based on SSLC
        document.getElementById('totalMarks').value = totalMarks;
        document.getElementById('marksObtained').value = obtainedMarks;
        document.getElementById('percentage').value = percentage;
    }
}

function setupEventListeners() {
    // Real-time validation
    document.querySelectorAll('input, select, textarea').forEach(field => {
        field.addEventListener('blur', function() {
            validateField(this);
        });
        
        field.addEventListener('input', function() {
            clearError(this);
        });
    });
    
    // Progress bar click navigation
    document.querySelectorAll('.progress-step').forEach(step => {
        step.addEventListener('click', function() {
            const stepNum = parseInt(this.dataset.step);
            if (stepNum < currentStep || validateCurrentStep()) {
                currentStep = stepNum;
                showStep(stepNum);
            }
        });
    });
}

function showStep(step) {
    // Hide all steps
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    
    // Show current step
    document.querySelectorAll('.step')[step].classList.add('active');
    
    // Update progress bar
    updateProgressBar(step);
    
    // Update buttons
    updateButtons(step);
    
    // Show summary on final step
    if (step === totalSteps - 1) {
        showReviewSummary();
    }
    
    // Scroll to top
    document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    currentStep = step;
}

function updateProgressBar(step) {
    document.querySelectorAll('.progress-step').forEach((s, idx) => {
        s.classList.remove('active', 'completed');
        if (idx < step) {
            s.classList.add('completed');
        } else if (idx === step) {
            s.classList.add('active');
        }
    });
}

function updateButtons(step) {
    const activeStep = document.querySelectorAll('.step')[step];
    const backBtn = activeStep ? activeStep.querySelector('.btn-secondary') : null;
    const nextBtn = activeStep ? activeStep.querySelector('.btn-primary') : null;

    if (!backBtn || !nextBtn) {
        return;
    }
    
    if (step === 0) {
        backBtn.disabled = true;
    } else {
        backBtn.disabled = false;
    }
    
    if (step === totalSteps - 1) {
        nextBtn.textContent = 'Generate Final PDF';
        nextBtn.type = 'submit';
    } else {
        nextBtn.textContent = 'Next →';
        nextBtn.type = 'button';
    }
}

function validateField(field) {
    if (field.disabled) {
        return true;
    }

    const value = typeof field.value === 'string' ? field.value.trim() : '';
    const fieldId = field.id;
    const errorElement = document.getElementById(fieldId + '-error');
    
    let isValid = true;
    
    // Required field check
    if (field.hasAttribute('required')) {
        const hasValue = field.type === 'checkbox' ? field.checked : !!value;
        if (!hasValue) {
            isValid = false;
            if (errorElement) {
                errorElement.textContent = 'This field is required';
            }
        }
    }
    
    // Pattern validation
    if (isValid && field.hasAttribute('pattern') && value) {
        const pattern = new RegExp(field.getAttribute('pattern'));
        if (!pattern.test(value)) {
            isValid = false;
            if (errorElement) {
                errorElement.textContent = field.title || 'Invalid format';
            }
        }
    }
    
    // Email validation
    if (isValid && field.type === 'email' && value) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(value)) {
            isValid = false;
            if (errorElement) {
                errorElement.textContent = 'Invalid email address';
            }
        }
    }
    
    // Mobile validation
    if (isValid && fieldId === 'mobile' && value && value.length !== 10) {
        isValid = false;
        if (errorElement) {
            errorElement.textContent = 'Mobile must be 10 digits';
        }
    }
    
    if (!isValid) {
        field.classList.add('invalid');
        if (errorElement) {
            errorElement.style.display = 'block';
        }
    } else {
        field.classList.remove('invalid');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }
    
    return isValid;
}

function clearError(field) {
    const errorElement = document.getElementById(field.id + '-error');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
    field.classList.remove('invalid');
}

function validateCurrentStep() {
    const step = document.querySelectorAll('.step')[currentStep];
    const fields = step.querySelectorAll('input[required], select[required], textarea[required]');
    
    let allValid = true;
    let missingFields = [];
    
    fields.forEach(field => {
        if (!validateField(field)) {
            allValid = false;
            const group = field.closest('.form-group');
            const label = group ? group.querySelector('label') : null;
            const fieldName = label ? label.textContent.replace(/\s*\*/g, '').trim() : field.id;
            missingFields.push(fieldName);
        }
    });
    
    if (!allValid && missingFields.length > 0) {
        alert('Please fill all required fields:\n\n' + missingFields.join('\n'));
    }
    
    return allValid;
}

function nextStep() {
    if (validateCurrentStep()) {
        if (currentStep < totalSteps - 1) {
            showStep(currentStep + 1);
        }
    }
}

function prevStep() {
    if (currentStep > 0) {
        showStep(currentStep - 1);
    }
}

function getFieldValue(fieldId) {
    const field = document.getElementById(fieldId);
    return field ? field.value : '';
}

function collectFormData() {
    formData = {
        // Step 0
        admissionNo: getFieldValue('admissionNo'),
        satsNo: getFieldValue('satsNo'),
        stream: getFieldValue('stream'),
        medium: getFieldValue('medium'),
        section: getFieldValue('section'),
        reservation: getFieldValue('reservation'),
        
        // Step 1
        studentName: getFieldValue('studentName'),
        dob: getFieldValue('dob'),
        gender: getFieldValue('gender'),
        placeOfBirth: getFieldValue('placeOfBirth'),
        state: getFieldValue('state'),
        district: getFieldValue('district'),
        taluk: getFieldValue('taluk'),
        nationality: getFieldValue('nationality'),
        religion: getFieldValue('religion'),
        caste: getFieldValue('caste'),
        subcaste: getFieldValue('subcaste'),
        
        // Step 2
        permanentAddress: getFieldValue('permanentAddress'),
        localAddress: getFieldValue('localAddress'),
        mobile: getFieldValue('mobile'),
        email: getFieldValue('email'),
        aadhaar: getFieldValue('aadhaar'),
        
        // Step 3
        fatherName: getFieldValue('fatherName'),
        motherName: getFieldValue('motherName'),
        parentAddress: getFieldValue('parentAddress'),
        income: getFieldValue('income'),
        incomeCertificate: getFieldValue('incomeCertificate'),
        
        // Step 4
        schoolName: getFieldValue('schoolName'),
        registerNo: getFieldValue('registerNo'),
        passingMonth: getFieldValue('passingMonth'),
        board: getFieldValue('board'),
        academicMedium: getFieldValue('academicMedium'),
        totalMarks: getFieldValue('totalMarks'),
        marksObtained: getFieldValue('marksObtained'),
        percentage: getFieldValue('percentage'),
        result: getFieldValue('result'),
        
        // SSLC Subject Marks
        lang1Name: getFieldValue('lang1Name'),
        lang1Marks: getFieldValue('lang1Marks'),
        lang2Name: getFieldValue('lang2Name'),
        lang2Marks: getFieldValue('lang2Marks'),
        lang3Name: getFieldValue('lang3Name'),
        lang3Marks: getFieldValue('lang3Marks'),
        mathMarks: getFieldValue('mathMarks'),
        scienceMarks: getFieldValue('scienceMarks'),
        socialScienceMarks: getFieldValue('socialScienceMarks'),
        
        // Step 5
        firstLanguage: getFieldValue('firstLanguage'),
        courses: getSelectedCheckboxes('courses'),
        activities: getSelectedCheckboxes('activities'),
        languageExemption: getFieldValue('languageExemption'),
        physicallyChallenged: getFieldValue('physicallyChallenged'),
        
        // Timestamp
        submittedAt: new Date().toLocaleString()
    };
    
    return formData;
}

function getSelectedCheckboxes(name) {
    const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value).join(', ');
}

function showReviewSummary() {
    try {
        collectFormData();
        const uploadedDocuments = getUploadedDocuments();

        const summary = `
        <h4 style="color: #333; margin-bottom: 15px;">Application Summary</h4>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px;">
            <tr style="background: #f0f0f0;"><td style="padding: 10px; border: 1px solid #ddd;"><b>Admission Number</b></td><td style="padding: 10px; border: 1px solid #ddd;">${formData.admissionNo || 'N/A'}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #ddd;"><b>SATS Number</b></td><td style="padding: 10px; border: 1px solid #ddd;">${formData.satsNo || 'N/A'}</td></tr>
            <tr style="background: #f0f0f0;"><td style="padding: 10px; border: 1px solid #ddd;"><b>Student Name</b></td><td style="padding: 10px; border: 1px solid #ddd;">${formData.studentName || 'N/A'}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #ddd;"><b>Stream</b></td><td style="padding: 10px; border: 1px solid #ddd;">${formData.stream || 'N/A'}</td></tr>
            <tr style="background: #f0f0f0;"><td style="padding: 10px; border: 1px solid #ddd;"><b>Medium</b></td><td style="padding: 10px; border: 1px solid #ddd;">${formData.medium || 'N/A'}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #ddd;"><b>Section</b></td><td style="padding: 10px; border: 1px solid #ddd;">${formData.section || 'N/A'}</td></tr>
            <tr style="background: #f0f0f0;"><td style="padding: 10px; border: 1px solid #ddd;"><b>Date of Birth</b></td><td style="padding: 10px; border: 1px solid #ddd;">${formData.dob || 'N/A'}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #ddd;"><b>Mobile</b></td><td style="padding: 10px; border: 1px solid #ddd;">${formData.mobile || 'N/A'}</td></tr>
            <tr style="background: #f0f0f0;"><td style="padding: 10px; border: 1px solid #ddd;"><b>Email</b></td><td style="padding: 10px; border: 1px solid #ddd;">${formData.email || 'N/A'}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #ddd;"><b>Percentage</b></td><td style="padding: 10px; border: 1px solid #ddd;">${formData.percentage || '0'}%</td></tr>
            <tr style="background: #f0f0f0;"><td style="padding: 10px; border: 1px solid #ddd;"><b>Courses</b></td><td style="padding: 10px; border: 1px solid #ddd;">${formData.courses || 'N/A'}</td></tr>
        </table>

        <h4 style="color: #333; margin: 20px 0 12px;">Uploaded Documents</h4>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px;">
            ${uploadedDocuments.map((doc, index) => `
                <tr style="background: ${index % 2 === 0 ? '#f0f0f0' : '#ffffff'};">
                    <td style="padding: 10px; border: 1px solid #ddd;"><b>${doc.label}</b></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${doc.status}</td>
                </tr>
            `).join('')}
        </table>

        <div style="background: #eef7ff; border-left: 4px solid #2e6da4; padding: 14px; border-radius: 6px; margin-bottom: 16px;">
            <h4 style="margin-bottom: 8px; color: #1f4e79;">Declaration To College</h4>
            <p style="margin: 0; line-height: 1.6; color: #2f3e46;">I confirm that all information provided in this application is true and complete to the best of my knowledge. I understand that the college may verify the details and documents submitted by me, and any incorrect information may affect admission eligibility.</p>
        </div>

        <div style="background: #f8f9fa; border: 1px solid #d7dee3; padding: 14px; border-radius: 6px; color: #495057; line-height: 1.6;">
            <b>Instruction:</b> Click <b>Generate Final PDF</b> to download your complete application summary as a PDF file for submission to the college.
        </div>
    `;
        
        const reviewElement = document.getElementById('reviewSummary');
        if (reviewElement) {
            reviewElement.innerHTML = summary;
        }
    } catch (error) {
        console.error('Error generating summary:', error);
        const reviewElement = document.getElementById('reviewSummary');
        if (reviewElement) {
            reviewElement.innerHTML = '<p style="color: red;">Error loading summary. Please scroll up to verify your information.</p>';
        }
    }
}

async function submitForm(e) {
    e.preventDefault();
    
    // Final validation
    if (!validateCurrentStep()) {
        alert('Please fill all required fields');
        return;
    }
    
    // Check required file uploads
    const studentPhoto = document.getElementById('studentPhoto').files.length;
    const marksheet = document.getElementById('marksheet').files.length;
    const transferCertificate = document.getElementById('transferCertificate').files.length;
    
    if (!studentPhoto || !marksheet || !transferCertificate) {
        alert('Please upload: Student Photo, Marksheet, and Transfer Certificate');
        return;
    }
    
    // Check terms agreement
    if (!document.getElementById('termsAgree').checked) {
        alert('Please accept the declaration');
        return;
    }
    
    collectFormData();
    
    // Show loading
    document.getElementById('loading').style.display = 'block';
    document.getElementById('admissionForm').style.display = 'none';
    
    try {
        await generateSubmissionPDF(formData);
        showSuccessMessage(formData.admissionNo);
    } catch (error) {
        console.error('Submission error:', error);
        showErrorMessage('Connection error: ' + error.message);
    }
}

function showSuccessMessage(admissionNo) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('admissionResult').textContent = admissionNo;
    document.getElementById('successMessage').classList.add('show');
    
    // Save to localStorage as backup
    localStorage.setItem('lastAdmissionNo', admissionNo);
    localStorage.setItem('formData', JSON.stringify(formData));
}

function getUploadedDocuments() {
    return [
        { label: 'Aadhaar Document', file: document.getElementById('aadhaarDocument')?.files?.[0] || null },
        { label: 'Student Photo', file: document.getElementById('studentPhoto')?.files?.[0] || null },
        { label: 'Marksheet', file: document.getElementById('marksheet')?.files?.[0] || null },
        { label: 'Transfer Certificate', file: document.getElementById('transferCertificate')?.files?.[0] || null }
    ].map(doc => ({
        label: doc.label,
        file: doc.file,
        status: doc.file ? `${doc.file.name} (${Math.max(1, Math.round(doc.file.size / 1024))} KB)` : 'Not uploaded'
    }));
}

function addPdfSection(doc, title, entries, yPosition) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const lineHeight = 7;
    let y = yPosition;

    if (y > pageHeight - 30) {
        doc.addPage();
        y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(title, margin, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    entries.forEach(entry => {
        const value = entry.value || 'N/A';
        const lines = doc.splitTextToSize(`${entry.label}: ${value}`, pageWidth - (margin * 2));
        if (y + (lines.length * lineHeight) > pageHeight - 20) {
            doc.addPage();
            y = 20;
        }
        doc.text(lines, margin, y);
        y += lines.length * lineHeight;
    });

    return y + 4;
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Unable to read file for PDF generation'));
        reader.readAsDataURL(file);
    });
}

async function addStudentPhotoToPdf(pdf) {
    const photoFile = document.getElementById('studentPhoto')?.files?.[0];

    if (!photoFile || !photoFile.type.startsWith('image/')) {
        return;
    }

    const imageDataUrl = await readFileAsDataUrl(photoFile);
    const imageProps = pdf.getImageProperties(imageDataUrl);
    const maxWidth = 35;
    const maxHeight = 45;
    const ratio = Math.min(maxWidth / imageProps.width, maxHeight / imageProps.height);
    const renderWidth = imageProps.width * ratio;
    const renderHeight = imageProps.height * ratio;
    const x = 160 + ((maxWidth - renderWidth) / 2);
    const y = 15 + ((maxHeight - renderHeight) / 2);

    pdf.setDrawColor(180, 180, 180);
    pdf.rect(160, 15, maxWidth, maxHeight);
    pdf.addImage(imageDataUrl, photoFile.type === 'image/png' ? 'PNG' : 'JPEG', x, y, renderWidth, renderHeight);
}

async function generateSubmissionPDF(data) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const uploadedDocuments = getUploadedDocuments();

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text('Sri Vidyalaya PU College', 15, 18);
    pdf.setFontSize(14);
    pdf.text('Admission Application Summary', 15, 27);

    await addStudentPhotoToPdf(pdf);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Generated On: ${data.submittedAt}`, 15, 35);
    pdf.text(`Admission Number: ${data.admissionNo || 'N/A'}`, 15, 41);

    let y = 50;

    y = addPdfSection(pdf, 'Basic Information', [
        { label: 'Admission Number', value: data.admissionNo },
        { label: 'SATS Number', value: data.satsNo },
        { label: 'Stream', value: data.stream },
        { label: 'Medium', value: data.medium },
        { label: 'Section', value: data.section },
        { label: 'Reservation Category', value: data.reservation }
    ], y);

    y = addPdfSection(pdf, 'Personal Details', [
        { label: 'Student Name', value: data.studentName },
        { label: 'Date of Birth', value: data.dob },
        { label: 'Gender', value: data.gender },
        { label: 'Place of Birth', value: data.placeOfBirth },
        { label: 'State', value: data.state },
        { label: 'District', value: data.district },
        { label: 'Taluk', value: data.taluk },
        { label: 'Nationality', value: data.nationality },
        { label: 'Religion', value: data.religion },
        { label: 'Caste', value: data.caste },
        { label: 'Subcaste', value: data.subcaste }
    ], y);

    y = addPdfSection(pdf, 'Contact Details', [
        { label: 'Permanent Address', value: data.permanentAddress },
        { label: 'Local Address', value: data.localAddress },
        { label: 'Mobile', value: data.mobile },
        { label: 'Email', value: data.email },
        { label: 'Aadhaar Number', value: data.aadhaar }
    ], y);

    y = addPdfSection(pdf, 'Family Details', [
        { label: 'Father Name', value: data.fatherName },
        { label: 'Mother Name', value: data.motherName },
        { label: 'Parent Address', value: data.parentAddress },
        { label: 'Annual Income', value: data.income },
        { label: 'Income Certificate', value: data.incomeCertificate }
    ], y);

    y = addPdfSection(pdf, 'Academic Details', [
        { label: 'School Name', value: data.schoolName },
        { label: 'Register Number', value: data.registerNo },
        { label: 'Passing Month', value: data.passingMonth },
        { label: 'Board', value: data.board },
        { label: 'Academic Medium', value: data.academicMedium },
        { label: 'Total Marks', value: data.totalMarks },
        { label: 'Marks Obtained', value: data.marksObtained },
        { label: 'Percentage', value: data.percentage },
        { label: 'Result', value: data.result },
        { label: '1st Language', value: `${data.lang1Name || 'N/A'} - ${data.lang1Marks || 'N/A'}` },
        { label: '2nd Language', value: `${data.lang2Name || 'N/A'} - ${data.lang2Marks || 'N/A'}` },
        { label: '3rd Language', value: `${data.lang3Name || 'N/A'} - ${data.lang3Marks || 'N/A'}` },
        { label: 'Mathematics', value: data.mathMarks },
        { label: 'Science', value: data.scienceMarks },
        { label: 'Social Science', value: data.socialScienceMarks }
    ], y);

    y = addPdfSection(pdf, 'Course Preferences', [
        { label: 'First Language', value: data.firstLanguage },
        { label: 'Courses Selected', value: data.courses },
        { label: 'Activities', value: data.activities },
        { label: 'Language Exemption', value: data.languageExemption },
        { label: 'Physically Challenged', value: data.physicallyChallenged }
    ], y);

    y = addPdfSection(pdf, 'Uploaded Documents', uploadedDocuments.map(doc => ({
        label: doc.label,
        value: doc.status
    })), y);

    if (y > 235) {
        pdf.addPage();
        y = 20;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Declaration', 15, y);
    y += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const declarationText = pdf.splitTextToSize(
        'I declare that the information provided in this application is true and correct to the best of my knowledge. I understand that this PDF is my final application record for submission to the college.',
        180
    );
    pdf.text(declarationText, 15, y);

    const fileName = `${(data.studentName || 'Admission_Form').replace(/[^a-zA-Z0-9]/g, '_')}_${data.admissionNo || 'Draft'}.pdf`;
    pdf.save(fileName);
}

function showErrorMessage(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('admissionForm').style.display = 'block';
    alert(message);
}

// Print summary
function printSummary() {
    window.print();
}

// Generate submission PDF
function downloadPDF() {
    collectFormData();
    generateSubmissionPDF(formData).catch(error => {
        console.error('PDF generation error:', error);
        alert('Unable to generate PDF. Please try again.');
    });
}
