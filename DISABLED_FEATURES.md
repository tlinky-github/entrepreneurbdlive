# 🔒 Features Disabled for Now

This document outlines features that have been disabled and will be implemented later.

## ✅ Currently Disabled Features

### 1. **Login/Registration** 
- **Location**: Header component
- **Status**: Shows "Coming Soon" popup when clicked
- **Message**: "Coming Soon! Authentication will be implemented soon."
- **Files Changed**: `src/components/layout/Header.jsx`

### 2. **Comments System**
- **Location**: Blog detail page and other content pages
- **Status**: Shows "Comments Coming Soon" message
- **Message**: "The comments feature will be implemented in the next update. Stay tuned!"
- **Files Changed**: `src/pages/blog/BlogDetail.jsx`

### 3. **User Profile & Account Management**
- **Location**: User dropdown menu
- **Status**: Still shows links but should be disabled in next update
- **Action**: Hide user profile links from non-authenticated users

### 4. **Following & Interaction Features**
- **Location**: Entrepreneur and profile pages
- **Status**: API endpoints exist but feature disabled
- **Action**: Coming soon notifications added

## 🚀 How to Re-enable Features

When ready to implement these features:

### Login/Register
Edit `src/components/layout/Header.jsx` and uncomment the Link components:
```jsx
// Change from button with toast to Link to="/login"
<Link to="/login">
  <Button>Login</Button>
</Link>
```

### Comments
Edit `src/pages/blog/BlogDetail.jsx` and restore the comment form section.

## 📋 Future Implementation Checklist

- [ ] Set up authentication system
- [ ] Implement JWT tokens
- [ ] Create user registration flow
- [ ] Add email verification
- [ ] Implement comments system
- [ ] Add user profiles
- [ ] Set up following system
- [ ] Add like/bookmark features
- [ ] Implement notifications

## 🛠️ Backend Requirements

When implementing these features, you'll need:

1. **User Management Endpoints**
   - POST /api/auth/register
   - POST /api/auth/login
   - GET /api/auth/me
   - POST /api/auth/logout

2. **Comments Endpoints**
   - POST /api/comments
   - GET /api/comments/:type/:id
   - DELETE /api/comments/:id

3. **User Profile Endpoints**
   - GET /api/users/:id
   - PUT /api/users/:id
   - GET /api/users/:id/profile

4. **Database Tables**
   - users
   - comments
   - user_profiles
   - followers

## 💡 Notes

- All disabled features have clear "Coming Soon" messages to users
- No broken functionality - disabled features gracefully handle user interactions
- Backend API routes still exist but are disabled in the UI
- Easy to re-enable once backend is ready

---

**Last Updated**: January 29, 2026
