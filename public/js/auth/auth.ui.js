function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePassword(password) {
  return password.length >= 8;
}

function showPasswordStrength(password) {
  const result = checkPasswordStrength(password);
  
  const colors = {
    weak: '#ef4444',
    fair: '#f59e0b',
    good: '#3b82f6',
    strong: '#10b981'
  };

  return {
    color: colors[result.strength],
    width: `${(result.score / 4) * 100}%`,
    text: result.strength.toUpperCase(),
    feedback: result.feedback
  };
}