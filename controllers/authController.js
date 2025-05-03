exports.showAuthHomePage = (req, res) => {
  res.render('auth/authHome'); // Entry page for auth (choose sign in or sign up)
};

exports.showSigninPage = (req, res) => {
  res.render('auth/signin'); // Render sign-in page
};

exports.handleSignin = (req, res) => {
  // TODO: Implement sign-in logic (JWT, validation, etc.)
  res.send('Signing in...');
};

exports.showSignupPage = (req, res) => {
  res.render('auth/signup'); // Render sign-up page
};

exports.handleSignup = (req, res) => {
  // TODO: Implement sign-up logic (password hash, email verify, etc.)
  res.send('Signing up...');
};

exports.showResetSendEmailPage = (req, res) => {
  res.render('auth/reset'); // Page to input email to send reset link
};

exports.handleResetSendEmail = (req, res) => {
  // TODO: Send password reset email with token
  res.send('Reset email sent (stub).');
};

exports.showResetPwdPage = (req, res) => {
  const token = req.params.token;
  res.render('auth/resetVerified', { token }); // Page to input new password
};

exports.handleResetPwd = (req, res) => {
  const token = req.params.token;
  // TODO: Validate token & reset password
  res.send(`Password reset for token: ${token}`);
};

exports.showEmailVerifiedPage = (req, res) => {
  const token = req.params.token;
  // TODO: Verify token and activate user
  res.render('auth/emailVerified', { token });
};