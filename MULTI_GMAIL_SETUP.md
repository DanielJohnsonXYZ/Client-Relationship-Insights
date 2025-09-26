# 📧 Multi-Gmail Account Setup Guide

This feature allows users to connect multiple Gmail accounts (e.g., work email + client email) to get comprehensive relationship insights.

## 🚀 Setup Steps

### 1. Database Migration
Run this SQL in your Supabase SQL Editor:

```sql
-- Copy and paste the entire contents of gmail-accounts-schema.sql
-- This creates the gmail_accounts table and updates emails table
```

### 2. Update Google OAuth Settings  
In your Google Cloud Console:

1. **Add New Redirect URI**:
   ```
   https://your-domain.vercel.app/api/gmail-accounts/callback
   ```

2. **Ensure These Scopes** (should already be configured):
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/userinfo.email` 
   - `https://www.googleapis.com/auth/userinfo.profile`

### 3. Deploy the Code
```bash
git add .
git commit -m "Add multi-Gmail account support"
git push
```

## 👤 User Experience

### **Connecting Multiple Accounts**

1. **User goes to Dashboard**
2. **Sees Gmail Account Manager section** with:
   - List of connected accounts
   - "Add Gmail" button
   
3. **To connect work email**:
   - Click "Add Gmail"  
   - Enter label: "Work Email"
   - Click "Connect" → OAuth popup
   - Authorize `work@company.com`

4. **To connect client email**:
   - Click "Add Gmail" again
   - Enter label: "Client Email" 
   - Click "Connect" → OAuth popup
   - Authorize `me@clientcompany.com`

### **Using Multiple Accounts**

**View All Data** (Default):
- Select "All Accounts" in Gmail Manager
- See insights from both work + client emails
- Get complete relationship picture

**Filter by Account**:
- Select specific Gmail account
- View insights only from that account
- Compare work vs client perspectives

**Sync Options**:
- "Sync All" → Updates both accounts
- Individual "Sync" buttons per account
- Account-specific email counts

## 🎯 Use Cases

### **Scenario 1: Consultant with Client Gmail**
- **Work Gmail**: `john@consultingfirm.com`
- **Client Gmail**: `john@clientcompany.com` 
- **Benefit**: See both sides of communications

### **Scenario 2: Business Owner with Multiple Domains**
- **Main Business**: `owner@maincompany.com`
- **Side Business**: `owner@sideproject.com`
- **Benefit**: Manage relationships across ventures

### **Scenario 3: Sales Rep with Team Account**
- **Personal**: `sales@company.com`
- **Team**: `team@company.com`
- **Benefit**: Personal + shared relationship insights

## 🔧 Technical Features

- ✅ **Secure OAuth** for each Gmail account
- ✅ **Account-specific sync** with rate limiting
- ✅ **Unified or filtered insights** 
- ✅ **Account labeling** ("Work", "Client", etc.)
- ✅ **Token refresh** handling per account
- ✅ **RLS security** maintains data isolation

## 🎨 UI Components

**Gmail Account Manager**:
- Visual account selector
- Sync status indicators
- Individual and bulk actions
- Account health monitoring

**Filtered Views**:
- "All Accounts" mode (default)
- Account-specific filtering
- Clear visual indicators
- Context-aware messaging

This provides a complete multi-Gmail solution for comprehensive client relationship insights! 🚀