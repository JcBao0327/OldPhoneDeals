document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    // ===== Sign In Page =====
    if (path.replace(/\/$/, '') === '/auth/signin') {
        const backBtn = document.getElementById('backToAuth');
        const signInForm = document.getElementById('signInForm');

        if (backBtn) {
          backBtn.addEventListener('click', () => {
            window.location.href = `/auth`;
        });
        }

        if (signInForm) {
          signInForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            const email = document.getElementById('emailInput').value;
            const password = document.getElementById('passwordInput').value;
        
            try {
              const res = await fetch('/auth/signin', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
              });
      
              const data = await res.json();
      
              if (res.ok) {
                window.location.href = data.redirectTo || '/';
              } else {
                alert(data.error || 'Login failed');
              }
            } catch (err) {
              alert('Something went wrong.');
              console.error(err);
            }
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
        signUpForm.addEventListener('submit', async (e) => {
          e.preventDefault();
    
          const email = document.getElementById('emailInput').value.trim();
          const password = document.getElementById('passwordInput').value;
          const confirmPassword = document.getElementById('confirmPasswordInput').value;
          const firstName = document.getElementById('firstNameInput').value.trim();
          const lastName = document.getElementById('lastNameInput').value.trim();
    
          const strongPwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    
          if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
          }
    
          if (!strongPwdRegex.test(password)) {
            alert('Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.');
            return;
          }
    
          try {
            const res = await fetch('/auth/signup', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                email,
                password,
                firstName,
                lastName
              })
            });
    
            const data = await res.json();
    
            if (res.ok) {
              alert('A verification email has been sent to your email address. Please check your inbox and click the link to verify your account.');
            } else {
              alert(data.error || 'Signup failed');
            }
          } catch (err) {
            alert('Something went wrong.');
            console.error(err);
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
          resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
      
            const email = document.getElementById('emailInput').value.trim();
      
            try {
              const res = await fetch('/auth/reset', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
              });
      
              const data = await res.json();
      
              if (res.ok) {
                alert('A reset email has been sent. Please check your inbox.');
              } else {
                alert(data.error || 'Reset request failed.');
              }
            } catch (err) {
              console.error(err);
              alert('Something went wrong. Please try again later.');
            }
          });
        }
    }

      // ===== Reset Verified Page =====
      if (path.startsWith('/auth/reset/') && path.replace(/\/$/, '') !== '/auth/reset') {
        const resetForm = document.getElementById('resetVerifiedForm');

        if (resetForm) {
          resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
      
            const pwd = document.getElementById('passwordInput').value;
            const confirmPwd = document.getElementById('confirmPasswordInput').value;
            const token = document.getElementById('resetToken').value;
      
            const strongPwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
            if (!strongPwdRegex.test(pwd)) {
              alert('Password must be strong: 8+ chars, upper/lowercase, number & symbol');
              return;
            }

            if (pwd !== confirmPwd) {
              alert('Passwords do not match!');
              return;
            }
      
            try {
              const res = await fetch(`/auth/reset/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: pwd })
              });
      
              const data = await res.json();
      
              if (res.ok) {
                alert('Password reset successfully! You will now be redirected to Sign In page.');
                window.location.href = '/auth/signin';
              } else {
                alert(data.error || 'Reset failed.');
              }
            } catch (err) {
              console.error('Reset error:', err);
              alert('Something went wrong.');
            }
          });
        }
    }
  });