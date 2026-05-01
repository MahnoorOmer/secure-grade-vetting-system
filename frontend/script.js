document.addEventListener('input', (event) => {
    // Check if the typed element is one of our MFA boxes
    if (event.target && event.target.classList.contains('mfa-digit-input')) {
        const input = event.target;
        const val = input.value;

        if (val.length === 1) {
            // Find the ID (e.g., "sms-s1") and calculate the next ID ("sms-s2")
            const currentId = input.id;
            const prefix = currentId.split(/(\d+)/)[0]; // Extracts "sms-s"
            const index = parseInt(currentId.split(/(\d+)/)[1]); // Extracts the number
            
            const nextInput = document.getElementById(`${prefix}${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    }
});

document.addEventListener('keydown', (event) => {
    // Handle Backspace to go to previous box
    if (event.key === 'Backspace' && event.target.classList.contains('mfa-digit-input')) {
        if (event.target.value === '') {
            const currentId = event.target.id;
            const prefix = currentId.split(/(\d+)/)[0];
            const index = parseInt(currentId.split(/(\d+)/)[1]);
            
            const prevInput = document.getElementById(`${prefix}${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Fix for Register Button
    const regBtn = document.getElementById('register-btn');
    if (regBtn) regBtn.addEventListener('click', handleRegister);

    // Fix for Role Select Button
    const roleBtn = document.getElementById('role-select-btn');
    if (roleBtn) roleBtn.addEventListener('click', () => showScreen('role-select'));

    // Fix for Prev Step Button
    const prevBtn = document.getElementById('prev-step-btn'); // Assuming you add this ID
    if (prevBtn) prevBtn.addEventListener('click', prevSignupStep);
});