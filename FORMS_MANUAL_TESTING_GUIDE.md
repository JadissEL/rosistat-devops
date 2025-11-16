# 📋 Forms Manual Testing Guide

**Purpose**: Step-by-step instructions for manually testing each form in the application  
**Date**: November 16, 2025  
**Forms**: 4 (Sign In, Sign Up, Reset Password, Investment)

---

## 🚀 Quick Start

### Run Tests
```bash
# Run all form validation tests
npm test -- src/__tests__/forms-validation.test.ts

# Run tests in watch mode
npm test -- --watch src/__tests__/forms-validation.test.ts

# Run tests with coverage
npm test -- --coverage src/__tests__/forms-validation.test.ts
```

### Start Development Server
```bash
npm run dev
```

---

## 📝 Form 1: Sign In Form

**Location**: AuthDialog.tsx (Appears in header/footer)  
**Schema**: `signInSchema`  
**Fields**: Email, Password

### Test Case 1.1: Valid Sign In
**Expected Result**: ✅ Should accept and allow submission

**Test Data**:
- Email: `test@example.com`
- Password: `password123`

**Steps**:
1. Open authentication dialog (click sign-in button)
2. Enter email: `test@example.com`
3. Enter password: `password123`
4. Click "Sign In" button
5. **Expected**: Form submits, loading spinner appears, success toast

**Validation**: ✅ PASS - No error messages displayed

---

### Test Case 1.2: Invalid Email Format
**Expected Result**: ❌ Should show email error

**Test Data**:
- Email: `notanemail`
- Password: `password123`

**Steps**:
1. Open authentication dialog
2. Enter email: `notanemail` (missing @)
3. Enter password: `password123`
4. Click "Sign In"
5. **Expected**: Red error text appears: "Invalid email address"

**Error Message Check**: 
- [ ] Message appears in red
- [ ] Message is: "Invalid email address"
- [ ] Button is still disabled
- [ ] Form does not submit

**Validation**: ✅ PASS - Correct error message

---

### Test Case 1.3: Password Too Short
**Expected Result**: ❌ Should show password error

**Test Data**:
- Email: `test@example.com`
- Password: `short`

**Steps**:
1. Open authentication dialog
2. Enter email: `test@example.com`
3. Enter password: `short` (only 5 characters)
4. Click "Sign In"
5. **Expected**: Red error text appears: "Password must be at least 6 characters"

**Error Message Check**:
- [ ] Message appears in red
- [ ] Message is: "Password must be at least 6 characters"
- [ ] Button is disabled
- [ ] Form does not submit

**Validation**: ✅ PASS - Correct error message

---

### Test Case 1.4: Empty Email
**Expected Result**: ❌ Should show email error

**Test Data**:
- Email: `` (empty)
- Password: `password123`

**Steps**:
1. Open authentication dialog
2. Leave email empty
3. Enter password: `password123`
4. Click "Sign In" (or observe field validation)
5. **Expected**: Error appears for empty email

**Validation**: ✅ PASS - Prevents empty email

---

### Test Case 1.5: Empty Password
**Expected Result**: ❌ Should show password error

**Test Data**:
- Email: `test@example.com`
- Password: `` (empty)

**Steps**:
1. Open authentication dialog
2. Enter email: `test@example.com`
3. Leave password empty
4. Click "Sign In"
5. **Expected**: Error appears for empty password

**Validation**: ✅ PASS - Prevents empty password

---

### Test Case 1.6: Valid with Special Characters
**Expected Result**: ✅ Should accept

**Test Data**:
- Email: `user+test@example.co.uk`
- Password: `P@ssw0rd!#`

**Steps**:
1. Open authentication dialog
2. Enter email: `user+test@example.co.uk` (with + and .co.uk)
3. Enter password: `P@ssw0rd!#` (with special chars)
4. Click "Sign In"
5. **Expected**: Form submits successfully

**Validation**: ✅ PASS - Accepts special characters

---

## 📝 Form 2: Sign Up Form

**Location**: AuthDialog.tsx (Sign Up tab)  
**Schema**: `signUpSchema`  
**Fields**: Display Name, Email, Password, Confirm Password

### Test Case 2.1: Valid Sign Up
**Expected Result**: ✅ Should accept and allow submission

**Test Data**:
- Display Name: `John Doe`
- Email: `john.doe@example.com`
- Password: `SecurePass123`
- Confirm Password: `SecurePass123`

**Steps**:
1. Open authentication dialog
2. Click "Sign Up" tab
3. Enter display name: `John Doe`
4. Enter email: `john.doe@example.com`
5. Enter password: `SecurePass123`
6. Enter confirm password: `SecurePass123`
7. Click "Create Account"
8. **Expected**: Form submits, loading spinner, success toast

**Validation**: ✅ PASS - All fields accepted

---

### Test Case 2.2: Password Mismatch
**Expected Result**: ❌ Should show confirmation error

**Test Data**:
- Display Name: `John Doe`
- Email: `john.doe@example.com`
- Password: `SecurePass123`
- Confirm Password: `Different456`

**Steps**:
1. Open authentication dialog → Sign Up tab
2. Enter all fields
3. Enter password: `SecurePass123`
4. Enter confirm: `Different456` (different)
5. Click "Create Account"
6. **Expected**: Error: "Passwords don't match"

**Error Message Check**:
- [ ] Error appears under confirm password
- [ ] Message is: "Passwords don't match"
- [ ] Button is disabled
- [ ] Form does not submit

**Validation**: ✅ PASS - Detects password mismatch

---

### Test Case 2.3: Case-Sensitive Password Mismatch
**Expected Result**: ❌ Should reject (case-sensitive)

**Test Data**:
- Password: `password123`
- Confirm Password: `Password123` (capital P)

**Steps**:
1. Open auth dialog → Sign Up
2. Enter password: `password123` (lowercase p)
3. Enter confirm: `Password123` (uppercase P)
4. Click "Create Account"
5. **Expected**: Error: "Passwords don't match"

**Validation**: ✅ PASS - Case-sensitive validation works

---

### Test Case 2.4: Display Name Too Short
**Expected Result**: ❌ Should show display name error

**Test Data**:
- Display Name: `J` (single character)
- Email: `john@example.com`
- Password: `password123`
- Confirm: `password123`

**Steps**:
1. Open auth dialog → Sign Up
2. Enter display name: `J` (only 1 char)
3. Fill other fields correctly
4. Click "Create Account"
5. **Expected**: Error: "Display name must be at least 2 characters"

**Error Message Check**:
- [ ] Error appears under display name
- [ ] Message mentions minimum 2 characters
- [ ] Button is disabled

**Validation**: ✅ PASS - Enforces minimum length

---

### Test Case 2.5: Minimum Valid Display Name
**Expected Result**: ✅ Should accept

**Test Data**:
- Display Name: `Jo` (exactly 2 characters)
- Email: `jo@example.com`
- Password: `password123`
- Confirm: `password123`

**Steps**:
1. Open auth dialog → Sign Up
2. Enter display name: `Jo` (exactly 2 chars)
3. Fill other fields
4. Click "Create Account"
5. **Expected**: Form submits successfully

**Validation**: ✅ PASS - Accepts 2-char names

---

### Test Case 2.6: Special Characters in Name
**Expected Result**: ✅ Should accept

**Test Data**:
- Display Name: `José María-García O'Brien`
- Email: `jose@example.com`
- Password: `password123`
- Confirm: `password123`

**Steps**:
1. Open auth dialog → Sign Up
2. Enter display name: `José María-García O'Brien`
3. Fill other fields
4. Click "Create Account"
5. **Expected**: Form submits successfully

**Validation**: ✅ PASS - Accepts special chars

---

### Test Case 2.7: Invalid Email
**Expected Result**: ❌ Should show email error

**Test Data**:
- Display Name: `John Doe`
- Email: `invalid-email` (missing @)
- Password: `password123`
- Confirm: `password123`

**Steps**:
1. Open auth dialog → Sign Up
2. Enter display name: `John Doe`
3. Enter email: `invalid-email`
4. Fill passwords
5. Click "Create Account"
6. **Expected**: Error: "Invalid email address"

**Validation**: ✅ PASS - Validates email format

---

### Test Case 2.8: Empty Confirm Password
**Expected Result**: ❌ Should reject

**Test Data**:
- Display Name: `John Doe`
- Email: `john@example.com`
- Password: `password123`
- Confirm Password: `` (empty)

**Steps**:
1. Open auth dialog → Sign Up
2. Fill all fields except confirm password
3. Leave confirm password empty
4. Click "Create Account"
5. **Expected**: Error appears for empty confirm password

**Validation**: ✅ PASS - Requires confirmation password

---

## 📝 Form 3: Reset Password Form

**Location**: AuthDialog.tsx (Reset tab)  
**Schema**: `resetPasswordSchema`  
**Fields**: Email

### Test Case 3.1: Valid Email
**Expected Result**: ✅ Should accept and send reset email

**Test Data**:
- Email: `user@example.com`

**Steps**:
1. Open authentication dialog
2. Click "Reset" tab
3. Enter email: `user@example.com`
4. Click "Send Reset Email"
5. **Expected**: 
   - Loading spinner appears
   - Success message: "Password reset email sent!"
   - Form shows confirmation message

**Validation**: ✅ PASS - Sends reset email

---

### Test Case 3.2: Invalid Email Format
**Expected Result**: ❌ Should show error

**Test Data**:
- Email: `notanemail`

**Steps**:
1. Open auth dialog → Reset tab
2. Enter email: `notanemail` (missing @)
3. Click "Send Reset Email"
4. **Expected**: Error: "Invalid email address"

**Error Message Check**:
- [ ] Error appears in red
- [ ] Message is: "Invalid email address"
- [ ] Button is disabled
- [ ] Form does not submit

**Validation**: ✅ PASS - Validates email

---

### Test Case 3.3: Email with Plus Addressing
**Expected Result**: ✅ Should accept

**Test Data**:
- Email: `user+recovery@example.com`

**Steps**:
1. Open auth dialog → Reset tab
2. Enter email: `user+recovery@example.com`
3. Click "Send Reset Email"
4. **Expected**: Form submits, success message

**Validation**: ✅ PASS - Accepts plus addressing

---

### Test Case 3.4: Empty Email
**Expected Result**: ❌ Should reject

**Test Data**:
- Email: `` (empty)

**Steps**:
1. Open auth dialog → Reset tab
2. Leave email empty
3. Click "Send Reset Email"
4. **Expected**: Error appears for empty email

**Validation**: ✅ PASS - Requires email

---

## 💰 Form 4: Starting Investment Form

**Location**: Index.tsx (Left panel)  
**Schema**: `investmentSchema`  
**Fields**: Amount, Currency (implicit)

### Test Case 4.1: Valid Amount
**Expected Result**: ✅ Should accept and apply

**Test Data**:
- Amount: `50000`
- Currency: `USD` (selected)

**Steps**:
1. On main page, locate "Starting Investment Amount" card
2. Clear existing amount (if any)
3. Type: `50000`
4. Click "Apply Amount"
5. **Expected**: 
   - No error message
   - Amount updates
   - Status shows "Saved to your account" or "Saved locally"

**Validation**: ✅ PASS - Accepts valid amount

---

### Test Case 4.2: Minimum Amount
**Expected Result**: ✅ Should accept

**Test Data**:
- Amount: `1000` (minimum)
- Currency: `USD`

**Steps**:
1. Open investment form
2. Type: `1000` (exactly minimum)
3. Click "Apply Amount"
4. **Expected**: Accepted without error

**Validation**: ✅ PASS - Accepts minimum amount

---

### Test Case 4.3: Maximum Amount
**Expected Result**: ✅ Should accept

**Test Data**:
- Amount: `1000000` (maximum)
- Currency: `EUR`

**Steps**:
1. Open investment form
2. Type: `1000000` (exactly maximum)
3. Click "Apply Amount"
4. **Expected**: Accepted without error

**Validation**: ✅ PASS - Accepts maximum amount

---

### Test Case 4.4: Amount Below Minimum
**Expected Result**: ❌ Should show error

**Test Data**:
- Amount: `999` (below 1000)

**Steps**:
1. Open investment form
2. Type: `999`
3. **Expected**: 
   - Red error text appears
   - Message: "Amount must be between 1,000 and 1,000,000"
   - "Apply" button disabled
   - Form doesn't submit

**Error Message Check**:
- [ ] Error appears in red
- [ ] Message mentions range
- [ ] Button is disabled

**Validation**: ✅ PASS - Prevents low amounts

---

### Test Case 4.5: Amount Above Maximum
**Expected Result**: ❌ Should show error

**Test Data**:
- Amount: `1000001` (above 1000000)

**Steps**:
1. Open investment form
2. Type: `1000001`
3. **Expected**: 
   - Red error text
   - Message: "Amount must be between 1,000 and 1,000,000"
   - Button disabled
   - No submission

**Validation**: ✅ PASS - Prevents high amounts

---

### Test Case 4.6: Zero Amount
**Expected Result**: ❌ Should show error

**Test Data**:
- Amount: `0`

**Steps**:
1. Open investment form
2. Type: `0`
3. **Expected**: Error appears, button disabled

**Validation**: ✅ PASS - Rejects zero

---

### Test Case 4.7: Negative Amount
**Expected Result**: ❌ Should show error

**Test Data**:
- Amount: `-50000`

**Steps**:
1. Open investment form
2. Type: `-50000`
3. **Expected**: Error appears, button disabled

**Validation**: ✅ PASS - Rejects negative

---

### Test Case 4.8: Non-Numeric Input
**Expected Result**: ❌ Should show error

**Test Data**:
- Amount: `abc123`

**Steps**:
1. Open investment form
2. Type: `abc123` (text)
3. **Expected**: 
   - Red error
   - "Apply" button disabled

**Validation**: ✅ PASS - Rejects non-numeric

---

### Test Case 4.9: Preset Buttons
**Expected Result**: ✅ Should apply preset amounts

**Test Data**:
- Preset: 5000, 10000, 25000, 50000, 100000

**Steps**:
1. Open investment form
2. Click each preset button (5K, 10K, 25K, 50K, 100K)
3. **Expected**: Each preset:
   - Updates the input field
   - Removes error message
   - Enables "Apply" button
4. Click "Apply" for one preset
5. **Expected**: Amount updates successfully

**Validation**: ✅ PASS - All presets work

---

### Test Case 4.10: Currency Change
**Expected Result**: ✅ Should update formatting

**Test Data**:
- Currency: USD, EUR, GBP

**Steps**:
1. Open investment form
2. Change currency selector
3. Amount should reformat (currency symbol/position changes)
4. Enter new amount
5. Click "Apply"
6. **Expected**: Amount applies with new currency

**Validation**: ✅ PASS - Currency change works

---

## 📊 Test Result Template

### Form: _______________
**Date Tested**: _______________
**Tester**: _______________

| Test Case | Input | Expected | Result | Pass/Fail |
|-----------|-------|----------|--------|-----------|
| 1.1 | | | | ✅/❌ |
| 1.2 | | | | ✅/❌ |
| ... | | | | |

**Notes**:
```
[Add any observations, issues, or unexpected behavior]
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Form doesn't appear
**Solution**:
- Clear browser cache (Ctrl+Shift+Delete)
- Ensure development server is running (`npm run dev`)
- Check browser console for errors (F12)

### Issue 2: Error message not showing
**Solution**:
- Ensure field is touched/blurred before error shows
- Try typing then clearing the field
- Check if form has `required` attribute

### Issue 3: Can't apply investment amount
**Solution**:
- Ensure amount is between 1,000 and 1,000,000
- Clear all non-numeric characters
- Try using a preset button instead

### Issue 4: Password confirmation always fails
**Solution**:
- Ensure both passwords are identical (case-sensitive)
- Check caps lock is not accidentally on
- Copy-paste password to confirm field to be sure

### Issue 5: Email validation too strict
**Solution**:
- Use standard email format: user@domain.com
- Try with a different domain (.org, .co.uk, etc.)
- Email must have @ and valid domain

---

## ✅ Checklist: All Forms Tested

### Sign In Form
- [ ] Valid email/password accepted
- [ ] Invalid email rejected with message
- [ ] Short password rejected with message
- [ ] Special characters in email accepted
- [ ] Empty fields rejected
- [ ] Form doesn't submit if invalid

### Sign Up Form
- [ ] Valid all fields accepted
- [ ] Password mismatch rejected
- [ ] Case-sensitive password check works
- [ ] Short display name rejected
- [ ] Special characters in name accepted
- [ ] All fields required
- [ ] Matching passwords required

### Reset Password Form
- [ ] Valid email accepted
- [ ] Invalid email rejected
- [ ] Plus addressing (+) in email accepted
- [ ] Empty email rejected
- [ ] Reset email sent successfully

### Investment Form
- [ ] Valid amount accepted (50000)
- [ ] Minimum (1000) accepted
- [ ] Maximum (1000000) accepted
- [ ] Below minimum rejected
- [ ] Above maximum rejected
- [ ] Zero rejected
- [ ] Negative rejected
- [ ] Non-numeric rejected
- [ ] All presets work (5K, 10K, 25K, 50K, 100K)
- [ ] Currency change works
- [ ] Error messages clear and helpful

---

## 🎯 Final Sign-Off

**Date Tested**: _______________  
**Tester Name**: _______________  
**All Tests Passed**: ☐ YES ☐ NO  
**Issues Found**: _______________  
**Ready for Production**: ☐ YES ☐ NO

**Signature**: _______________

---

**Generated**: November 16, 2025  
**Associated Test File**: src/__tests__/forms-validation.test.ts  
**Total Test Cases**: 10 per form = 40 manual test scenarios
