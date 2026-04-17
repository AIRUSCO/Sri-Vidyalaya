// Global variables
let currentStep = 0;
const totalSteps = 7;
let formData = {};

// Google Apps Script deployment URL - Replace with your own
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby6-XHGIZvVUN0HUNpwnu7dj2fncPLtZesz32H37kgSYqqOeLwylTwyrydWj1WFTNUVCw/exec";

// Initialize form
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    setupEventListeners();
});

function initializeForm() {
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
    const backBtn = document.querySelector('.btn-secondary');
    const nextBtn = document.querySelector('.btn-primary');
    
    if (step === 0) {
        backBtn.disabled = true;
    } else {
        backBtn.disabled = false;
    }
    
    if (step === totalSteps) {
        nextBtn.textContent = 'Submit Application';
        nextBtn.type = 'submit';
    } else {
        nextBtn.textContent = 'Next →';
        nextBtn.type = 'button';
    }
}

function validateField(field) {
    const value = field.value.trim();
    const fieldId = field.id;
    const errorElement = document.getElementById(fieldId + '-error');
    
    if (!errorElement) return true;
    
    let isValid = true;
    
    // Required field check
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorElement.textContent = 'This field is required';
    }
    
    // Pattern validation
    if (isValid && field.hasAttribute('pattern') && value) {
        const pattern = new RegExp(field.getAttribute('pattern'));
        if (!pattern.test(value)) {
            isValid = false;
            errorElement.textContent = field.title || 'Invalid format';
        }
    }
    
    // Email validation
    if (isValid && field.type === 'email' && value) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(value)) {
            isValid = false;
            errorElement.textContent = 'Invalid email address';
        }
    }
    
    // Mobile validation
    if (isValid && fieldId === 'mobile' && value && value.length !== 10) {
        isValid = false;
        errorElement.textContent = 'Mobile must be 10 digits';
    }
    
    if (!isValid) {
        field.classList.add('invalid');
        errorElement.style.display = 'block';
    } else {
        field.classList.remove('invalid');
        errorElement.style.display = 'none';
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
    
    fields.forEach(field => {
        if (!validateField(field)) {
            allValid = false;
        }
    });
    
    return allValid;
}

function nextStep() {
    if (validateCurrentStep()) {
        if (currentStep < totalSteps) {
            showStep(currentStep + 1);
        }
    }
}

function prevStep() {
    if (currentStep > 0) {
        showStep(currentStep - 1);
    }
}

function collectFormData() {
    formData = {
        // Step 0
        admissionNo: document.getElementById('admissionNo').value,
        satsNo: document.getElementById('satsNo').value,
        stream: document.getElementById('stream').value,
        medium: document.getElementById('medium').value,
        section: document.getElementById('section').value,
        reservation: document.getElementById('reservation').value,
        
        // Step 1
        studentName: document.getElementById('studentName').value,
        dob: document.getElementById('dob').value,
        gender: document.getElementById('gender').value,
        placeOfBirth: document.getElementById('placeOfBirth').value,
        state: document.getElementById('state').value,
        district: document.getElementById('district').value,
        taluk: document.getElementById('taluk').value,
        nationality: document.getElementById('nationality').value,
        religion: document.getElementById('religion').value,
        caste: document.getElementById('caste').value,
        subcaste: document.getElementById('subcaste').value,
        
        // Step 2
        permanentAddress: document.getElementById('permanentAddress').value,
        localAddress: document.getElementById('localAddress').value,
        mobile: document.getElementById('mobile').value,
        email: document.getElementById('email').value,
        aadhaar: document.getElementById('aadhaar').value,
        
        // Step 3
        fatherName: document.getElementById('fatherName').value,
        motherName: document.getElementById('motherName').value,
        parentAddress: document.getElementById('parentAddress').value,
        income: document.getElementById('income').value,
        incomeCertificate: document.getElementById('incomeCertificate').value,
        
        // Step 4
        schoolName: document.getElementById('schoolName').value,
        registerNo: document.getElementById('registerNo').value,
        passingMonth: document.getElementById('passingMonth').value,
        board: document.getElementById('board').value,
        academicMedium: document.getElementById('academicMedium').value,
        totalMarks: document.getElementById('totalMarks').value,
        marksObtained: document.getElementById('marksObtained').value,
        percentage: document.getElementById('percentage').value,
        result: document.getElementById('result').value,
        
        // SSLC Subject Marks
        lang1Name: document.getElementById('lang1Name').value,
        lang1Marks: document.getElementById('lang1Marks').value,
        lang2Name: document.getElementById('lang2Name').value,
        lang2Marks: document.getElementById('lang2Marks').value,
        lang3Name: document.getElementById('lang3Name').value,
        lang3Marks: document.getElementById('lang3Marks').value,
        mathMarks: document.getElementById('mathMarks').value,
        scienceMarks: document.getElementById('scienceMarks').value,
        socialScienceMarks: document.getElementById('socialScienceMarks').value,
        
        // Step 5
        firstLanguage: document.getElementById('firstLanguage').value,
        courses: getSelectedCheckboxes('courses'),
        activities: getSelectedCheckboxes('activities'),
        languageExemption: document.getElementById('languageExemption').value,
        physicallyChallenged: document.getElementById('physicallyChallenged').value,
        
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
        
        // Quick document status check
        const aadhaarDoc = (document.getElementById('aadhaarDocument')?.files?.length || 0) > 0 ? '✓ Uploaded' : '⚠️ Not uploaded';
        const photoDoc = (document.getElementById('studentPhoto')?.files?.length || 0) > 0 ? '✓ Uploaded' : '⚠️ Not uploaded';
        const marksheetDoc = (document.getElementById('marksheet')?.files?.length || 0) > 0 ? '✓ Uploaded' : '⚠️ Not uploaded';
        const tcDoc = (document.getElementById('transferCertificate')?.files?.length || 0) > 0 ? '✓ Uploaded' : '⚠️ Not uploaded';
    
        const summary = `
        <h4 style="color: #333; margin-bottom: 15px;">📋 Application Summary</h4>
        
        <table style="width: 100%; border-collapse: collapse;">
            <tr style="background: #f0f0f0;"><td style="padding: 10px; border: 1px solid #ddd;"><b>Admission Number</b></td><td style="padding: 10px; border: 1px solid #ddd;">${formData.admissionNo || 'N/A'}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #ddd;"><b>Student Name</b></td><td style="padding: 10px; border: 1px solid #ddd;">${formData.studentName || 'N/A'}</td></tr>
            <tr style="background: #f0f0f0;"><td style="padding: 10px; border: 1px solid #ddd;"><b>Stream</b></td><td style="padding: 10px; border: 1px solid #ddd;">${formData.stream || 'N/A'}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #ddd;"><b>DOB</b></td><td style="padding: 10px; border: 1px solid #ddd;">${formData.dob || 'N/A'}</td></tr>
            <tr style="background: #f0f0f0;"><td style="padding: 10px; border: 1px solid #ddd;"><b>Mobile</b></td><td style="padding: 10px; border: 1px solid #ddd;">${formData.mobile || 'N/A'}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #ddd;"><b>Email</b></td><td style="padding: 10px; border: 1px solid #ddd;">${formData.email || 'N/A'}</td></tr>
            <tr style="background: #f0f0f0;"><td style="padding: 10px; border: 1px solid #ddd;"><b>Percentage</b></td><td style="padding: 10px; border: 1px solid #ddd;">${formData.percentage || '0'}%</td></tr>
        </table>
        
        <h4 style="color: #333; margin-top: 20px; margin-bottom: 15px;">📄 Documents</h4>
        <table style="width: 100%; border-collapse: collapse;">
            <tr style="background: #f0f0f0;"><td style="padding: 10px; border: 1px solid #ddd;"><b>Student Photo</b></td><td style="padding: 10px; border: 1px solid #ddd;">${photoDoc}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #ddd;"><b>Marksheet</b></td><td style="padding: 10px; border: 1px solid #ddd;">${marksheetDoc}</td></tr>
            <tr style="background: #f0f0f0;"><td style="padding: 10px; border: 1px solid #ddd;"><b>Transfer Certificate</b></td><td style="padding: 10px; border: 1px solid #ddd;">${tcDoc}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #ddd;"><b>Aadhaar Document</b></td><td style="padding: 10px; border: 1px solid #ddd;">${aadhaarDoc}</td></tr>
        </table>
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
            <p style="color: red;"><b>Error generating summary:</b> ${error.message}</p>
            <p>Please go back and check all fields are filled correctly.</p>
        `;
    }
}

async function submitForm(e) {
    e.preventDefault();
    console.log('Submit button clicked');
    
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
    console.log('Form data collected:', formData);
    
    // Show loading
    document.getElementById('loading').style.display = 'block';
    document.getElementById('admissionForm').style.display = 'none';
    
    try {
        // Collect all files and convert to base64
        const files = {
            aadhaarDocument: document.getElementById('aadhaarDocument').files[0],
            marksheet: document.getElementById('marksheet').files[0],
            studentPhoto: document.getElementById('studentPhoto').files[0],
            transferCertificate: document.getElementById('transferCertificate').files[0]
        };
        
        console.log('Files selected:', Object.keys(files).filter(k => files[k]));
        
        // Convert files to base64
        const fileData = {};
        
        for (const [key, file] of Object.entries(files)) {
            if (file) {
                await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        fileData[key] = {
                            data: e.target.result.split(',')[1], // Get base64 part
                            name: file.name,
                            type: file.type
                        };
                        console.log('File converted to base64:', key, file.name);
                        resolve();
                    };
                    reader.onerror = function(err) {
                        console.error('Error reading file:', key, err);
                        reject(err);
                    };
                    reader.readAsDataURL(file);
                });
            }
        }
        
        // Combine form data with file data
        const submitData = {
            ...formData,
            files: fileData
        };
        
        console.log('Submitting to URL:', GOOGLE_APPS_SCRIPT_URL);
        console.log('Submit data ready, sending...');
        
        // Send as JSON with no-cors mode
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(submitData),
            headers: {
                'Content-Type': 'application/json'
            },
            mode: 'no-cors'
        });
        
        // With 'no-cors' mode, we can't read the response content
        // But if fetch completes without throwing an error, the request was sent
        console.log('Request sent successfully to Google Apps Script');
        generateSubmissionPDF(formData);
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
function generateSubmissionPDF(data) {
    // This creates a local backup of the submission
    // Can be enhanced with jsPDF library if needed
    console.log('Submission PDF generated for admission:', data.admissionNo);
}

// Export as PDF (requires jsPDF library)
function downloadPDF() {
    alert('PDF download feature coming soon');
}
