# AWS Bedrock Credentials Setup \- Developer Guide

A comprehensive guide for developers to set up AWS credentials for Amazon Bedrock with Claude 3.7 Sonnet model access.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Option 1 - Accessing Amazon Bedrock Without Root-User Privileges](#option-1---accessing-amazon-bedrock-without-root-user-privileges)
  - [Step 1: Request Access from Your AWS Administrator](#step-1-request-access-from-your-aws-administrator)
  - [Step 2: Using Amazon Bedrock as an IAM User](#step-2-using-amazon-bedrock-as-an-iam-user)
    - [Log in (and switch role if required)](#a-log-in-and-switch-role-if-required)
    - [Check Bedrock Console Access](#b-check-bedrock-console-access)
    - [Generate Credentials for CLI/SDK Use](#c-generate-credentials-for-clisdk-use)
    - [Test Your Access](#d-test-your-access)
- [Option 2 - Accessing Amazon Bedrock with Root-User Privileges](#opion-2---accessing-amazon-bedrock-with-root-user-privileges)
  - [Step 1: Initial Login](#step-1-initial-login)
  - [Amazon Bedrock Configuration](#amazon-bedrock-configuration)
    - [Step 1: Access Bedrock Service](#step-1-access-bedrock-service)
    - [Step 2: Model Access Request](#step-2-model-access-request)
  - [IAM User Creation](#iam-user-creation)
    - [Step 1: Navigate to IAM Service](#step-1-navigate-to-iam-service)
    - [Step 2: User Configuration](#step-2-user-configuration)
  - [Permissions Configuration](#permissions-configuration)
    - [Step 1: Permission Strategy](#step-1-permission-strategy)
    - [Step 2: Attach Policies](#step-2-attach-policies)
  - [Access Key Generation](#access-key-generation)
    - [Step 1: Access Security Credentials](#step-1-access-security-credentials)
    - [Step 2: Create Access Keys](#step-2-create-access-keys)
    - [Step 3: Retrieve Credentials](#step-3-retrieve-credentials)
- [Integration with Project](#integration-with-project)

## Prerequisites

Before beginning this setup process, ensure you have:

- **AWS Account**: Active AWS account with administrative privileges
- **Console Access**: Ability to log into AWS Management Console
- **Permissions**: Authority to create IAM users, policies, and access keys

### Required AWS Services Access

- [Amazon Bedrock](https://aws.amazon.com/bedrock/)
- [AWS Identity and Access Management (IAM)](https://aws.amazon.com/iam/)
- [AWS CLI (for testing)](https://aws.amazon.com/cli/)

## Environment Setup

### Target Configuration

The Okta Cross App Access MCP demo will need these environment variables:

```shell
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
```

**Important**: This guide uses `us-east-1` (US East \- N. Virginia) as it has the broadest Amazon Bedrock model availability, including Claude Opus.



## Option 1 - Accessing Amazon Bedrock Without Root-User Privileges

If you are an IAM user in a shared AWS account (not the root user), you can still work with Amazon Bedrock once an administrator grants you the necessary permissions and model access. This section outlines both what to request from an admin and how to proceed after approval.

### Step 1: Request Access from Your AWS Administrator

Share this checklist with your AWS admin:

- **Attach a Bedrock policy** to your IAM user, group, or role:
  - **AmazonBedrockFullAccess** – full console & API access (development use).
  - **AmazonBedrockReadOnlyAccess** – console view only, no model invocations.
  - **AmazonBedrockLimitedAccess** – restricted scope for specific API keys and Marketplace subscriptions.

- **Model Access Approval**:
  - In the Bedrock console, the admin must grant your user or role **model access** to the  Claude 3.7 Sonnet model under **Bedrock → Model access**.

- **(Optional) Role-based Access**:
  - For security, the admin can create a dedicated IAM role with Bedrock permissions, and let you **assume** that role when needed.

- **API Key Creation Rights** (if you'll need long-term Bedrock API keys):
  - Admin must allow `iam:CreateServiceSpecificCredential` so you can generate Bedrock-specific credentials.

### Step 2: Using Amazon Bedrock as an IAM User

Once your admin has granted access:

#### a. Log in (and switch role if required)
1. Sign in to the AWS Console as an IAM user.
2. If you have a dedicated Bedrock role, go to **Account menu → Switch role**, enter the role ARN, and switch.

#### b. Check Bedrock Console Access
1. Ensure the region is set to **US East (N. Virginia) – us-east-1**.
2. Search for **Amazon Bedrock** in the console search bar and open it.
3. If you still see a “Sign-up” or “Request access” prompt, your **model access** hasn’t been approved—ask your admin to complete that step.

#### c. Generate Credentials for CLI/SDK Use

**Option 1 – Temporary Credentials via STS (recommended)**
```bash
aws sts assume-role \
  --role-arn arn:aws:iam::123456789012:role/BedrockAccessRole \
  --role-session-name bedrock-dev
# Use AccessKeyId, SecretAccessKey, and SessionToken from the output
```

**Option 2 – Long-term Bedrock API Key**
- In **IAM Console → Security credentials** (for your IAM user), choose **Create Bedrock API key**.
- Save the key ID and secret securely.

**Set environment variables locally**:
```bash
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_SESSION_TOKEN=... # if using STS
```

#### d. Test Your Access
```bash
# List models
aws bedrock list-foundation-models --region us-east-1

# Check if Claude Opus/Sonnet is visible
aws bedrock list-foundation-models \
  --region us-east-1 \
  --query "modelSummaries[?contains(modelId,'claude-3-opus')]"
```
If both commands return results, you're ready to integrate Bedrock into your app.


## Opion 2 - Accessing Amazon Bedrock with Root-User Privileges

### Step 1: Initial Login

1. **Navigate to AWS Console**

```
URL: https://aws.amazon.com
```

2. **Sign In Process**
   - Click **"Sign In to Console"**
   - Now, Click on **"Sign in using root user email"**
   - Select **"Root user"** or **"IAM user"** based on your account type
   - Enter your email address and password
   - Complete MFA authentication (if enabled)

![AWS Console Login](/images/image3.png)

3. **Verify Console Access**
   - Confirm you can see the AWS Management Console dashboard
   - Check the region selector in the top-right corner
   - Switch to **US East (N. Virginia) us-east-1** if not already selected

![AWS Console Dashboard](/images/image2.png)

## Amazon Bedrock Configuration

### Step 1: Access Bedrock Service

1. **Service Navigation**
   - Use the search bar at the top of AWS Console
   - Type: `Bedrock`
   - Click **"Amazon Bedrock"** from the dropdown results
2. **Initial Setup Check**
   - If first-time access, you may see a welcome/onboarding screen
   - Click **"Get Started"** if prompted
   - Review the service overview and pricing information

### Step 2: Model Access Request

1. **Navigate to Model Access**

```
Amazon Bedrock Console → Model access (left sidebar)
```

![Amazon Bedrock Model Access](/images/image8.png)

2. **Locate Claude Opus**
   - Find **"Anthropic Claude 3.7 Sonnet"** in the available models list
   - Note the current access status
3. **Request Access Process**

```
Status: "Available to request" → Click "Request model access"
```

4. **Complete Access Request Form**
   - **Use Case Description**: Provide a clear description of your intended use
   - **Example**: "Development of AI-powered application using Claude Opus for natural language processing and content generation"
   - Submit the request
5. **Wait for Approval**
   - Approval typically takes: 5 minutes to 2 hours
   - Status will change to: **"Access granted"**
   - You'll receive an email notification when approved

![Model Access Request Approved](/images/image4.png)

## IAM User Creation

### Step 1: Navigate to IAM Service

1. **Access IAM Console**

```
AWS Console → Search "IAM" → Identity and Access Management
```

2. **User Management**

```
IAM Dashboard → Users (left sidebar) → Create user
```

### Step 2: User Configuration

1. **User Details**

```
Username: bedrock-developer-[project-name]
Example: bedrock-developer-caa-mcp-demo
```

- Note: Since this user is for programmatic access only, **Do not** check "Provide user access to the AWS Management Console \- optional"
- Click **"Next"** to continue to permissions configuration

## Permissions Configuration

### Step 1: Permission Strategy

Choose the appropriate permission level based on your needs:

#### Option A: Full Bedrock Access (Recommended for Development)

```
Policy: AmazonBedrockFullAccess
```

#### Option B: Read-Only Access (For Production/Limited Use)

```
Policy: AmazonBedrockReadOnlyAccess
```

### Step 2: Attach Policies

1. **Permission Assignment Method**
   - Select: **"Attach policies directly"**
2. **Policy Search and Selection**

```
Search: "bedrock"
Select: ☑ AmazonBedrockFullAccess
```

![Attach Bedrock Policy](/images/image1.png)

- Click **"Next"** to review
- Verify username, attached policies and review permissions summary ( if added )
- Click **"Create user"**
- Note the success message
- User **"bedrock-developer-caa-mcp-demo"** should appear in the Users list.

![User Created Success](/images/image6.png)

## Access Key Generation

### Step 1: Access Security Credentials

1. **Navigate to User Details:**
   `IAM → Users → [Your created username] bedrock-developer-caa-mcp-demo`
2. **Security Credentials Tab**

`User Details Page → Security credentials tab`

### Step 2: Create Access Keys

1. **Initialize Key Creation**
   `Access keys section → Create access key`

![Create Access Key](/images/image5.png)

2. **Use Case Selection**
   `Select: "Application running outside AWS"`
   - `☑ Confirmation checkbox`

3. **Add Description**
   `Description tag value: "Bedrock API access for [project-name]"`
   `Example: "Bedrock API access for caa-mcp-demo"`

![Access Key Created](/images/image7.png)

### Step 3: Retrieve Credentials

**Critical**: This is your only opportunity to view the secret access key\!

```shell
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA[16-character-string]
AWS_SECRET_ACCESS_KEY=[40-character-secret-string]
```

**Notes:**

- Copy both values to a secure location
- Store in your password manager
- **Never** commit these to version control
- **Never** share in plain text communication

## Integration with Project

Now that your AWS credentials for Bedrock have been successfully generated, integrate them into your project:

1. **Navigate to Project Directory:**
   Open your terminal or command prompt and go to the `okta-cross-app-access-mcp-node-example` project folder.
2. **Locate `.env` File:**
   Find the `.env` file within the `packages/agent0/` directory.
3. **Paste Credentials:**
   Open the `.env` file and paste the `AWS_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY` values you obtained in the previous step. Ensure they are in the following format:

```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
```

**Important:** Replace `<your-access-key>` and `<your-secret-key>` with your actual generated credentials.

4. **Save the File:**
   Save the `.env` file after adding the credentials.

You have now successfully configured your AWS Bedrock credentials within your project, allowing your application to interact with the Claude 3.7 Sonnet model.
