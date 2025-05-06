document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
  
    // ===== Auth Home Page =====
    if (path.replace(/\/$/, '') === '/auth') {
      const signInButton = document.getElementById('signInButton');
      const signUpButton = document.getElementById('signUpButton');
      const backButton = document.getElementById('backToPrevPage');
  
      if (signInButton) {
        signInButton.addEventListener('click', () => {
          window.location.href = '/auth/signin';
        });
      }
  
      if (signUpButton) {
        signUpButton.addEventListener('click', () => {
          window.location.href = '/auth/signup';
        });
      }
  
      if (backButton) {
        backButton.addEventListener('click', () => {
          history.back();
        });
      }
    }
  
    // ===== Sign In Page =====
    if (path.replace(/\/$/, '') === '/auth/signin') {
        const backBtn = document.getElementById('backToAuth');
        const signInForm = document.getElementById('signInForm');

        if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = '/auth';
        });
        }

        if (signInForm) {
        signInForm.addEventListener('submit', (e) => {
            const email = document.getElementById('emailInput').value;
            // 可选：添加前端验证、加载动画、禁用按钮等
            if (!email.endsWith('.com')) {
              e.preventDefault();
              alert('Email must end with .com!');
              return;
            }
            console.log('Submitting sign in form');
        });
        }


    }

      // ===== Sign Up Page =====
      if (path.replace(/\/$/, '') === '/auth/signup') {
        const backBtn = document.getElementById('backToAuth');
        const signUpForm = document.getElementById('signUpForm');

        if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = '/auth';
        });
        }

        if (signUpForm) {
        signUpForm.addEventListener('submit', (e) => {
            const pwd = document.getElementById('passwordInput').value;
            const confirmPwd = document.getElementById('confirmPasswordInput').value;
            const email = document.getElementById('emailInput').value;

            if (pwd !== confirmPwd) {
            e.preventDefault();
            alert('Passwords do not match!');
            }

            if (!email.endsWith('.com')) {
              e.preventDefault();
              alert('Email must end with .com!');
              return;
            }
        });
        }
    } 

      // ===== Reset Password Page =====
      if (path.replace(/\/$/, '') === '/auth/reset') {
        const cancelBtn = document.getElementById('cancelButton');
        const resetForm = document.getElementById('resetRequestForm');

        if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            window.location.href = '/auth';
        });
        }

        if (resetForm) {
        resetForm.addEventListener('submit', () => {
          const email = document.getElementById('emailInput').value;
            if (!email.endsWith('.com')) {
              e.preventDefault();
              alert('Email must end with .com!');
              return;
            }
            console.log('Sending reset email...');
        });
        }
    }

      // ===== Reset Verified Page =====
      if (path.startsWith('/auth/reset/') && path.replace(/\/$/, '') !== '/auth/reset') {
        const resetForm = document.getElementById('resetVerifiedForm');

        if (resetForm) {
        resetForm.addEventListener('submit', (e) => {
            const pwd = document.getElementById('passwordInput').value;
            const confirmPwd = document.getElementById('confirmPasswordInput').value;

            if (pwd !== confirmPwd) {
            e.preventDefault();
            alert('Passwords do not match!');
            }
        });
        }
    }

      // ===== Email Verified Page =====
      if (path.startsWith('/auth/verify/')) {
        setTimeout(() => {
        window.location.href = '/auth/signin';
        }, 5000); // 5 seconds
    }
  });