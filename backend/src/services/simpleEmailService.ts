interface IEmailData {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export const logOTPToConsole = (data: IEmailData): boolean => {
  console.log("=".repeat(60));
  console.log("📧 EMAIL NOTIFICATION (Console Fallback)");
  console.log("=".repeat(60));
  console.log(`To: ${data.to}`);
  console.log(`Subject: ${data.subject}`);
  console.log(`Message: ${data.text}`);
  if (data.html) {
    console.log(`HTML: ${data.html}`);
  }
  console.log("=".repeat(60));
  console.log(
    "⚠️  This is a fallback method. In production, configure proper email service."
  );
  console.log("=".repeat(60));
  return true;
};

export default { logOTPToConsole };

