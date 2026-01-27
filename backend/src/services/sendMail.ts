import nodemailer from "nodemailer";
import { envConfig } from "../../config/config.js";
import { logOTPToConsole } from "./simpleEmailService.js";

const emailConfigs = {
  gmail: {
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: envConfig.email,
      pass: envConfig.password,
    },
    connectionTimeout: 30000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    pool: false,
    maxConnections: 1,
    maxMessages: 1,
    rateDelta: 2000,
    rateLimit: 1,
    tls: {
      rejectUnauthorized: false,
      ciphers: "TLSv1.2",
    },
    ignoreTLS: false,
    requireTLS: true,
    debug: false,
    logger: false,
  },
};

interface IData {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const sendMail = async (data: IData, retries: number = 2): Promise<boolean> => {
  const isProduction = process.env.NODE_ENV === "production";
  const providers = ["gmail"] as const;

  console.log(`Environment: ${isProduction ? "production" : "development"}`);
  console.log(`Available providers: ${providers.join(", ")}`);
  console.log(`Recipient: ${data.to}`);

  for (const provider of providers) {
    console.log(`Trying email provider: ${provider}`);

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(
          `Attempting to send email via ${provider} (attempt ${attempt}/${retries})`
        );

        const transporter = nodemailer.createTransport(emailConfigs[provider]);

        const mailOptions = {
          from: envConfig.email,
          to: data.to,
          subject: data.subject,
          text: data.text,
          html: data.html,
          requireTLS: true,
          secure: provider === "gmail",
        };

        const sendPromise = transporter.sendMail(mailOptions);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Email sending timeout")), 30000)
        );

        await Promise.race([sendPromise, timeoutPromise]);
        console.log(`✅ Email sent successfully via ${provider}`);
        console.log(
          `📧 Email details: To=${data.to}, Subject=${data.subject}`
        );

        transporter.close();
        return true;
      } catch (error: any) {
        console.error(
          `Email sending via ${provider} failed (attempt ${attempt}/${retries}):`,
          error.message
        );

        if (error.message.includes("validation_error")) {
          console.log(`❌ Validation error: ${error.message}`);
          break;
        } else if (error.message.includes("rate_limit")) {
          console.log(`⏰ Rate limit exceeded, trying next provider...`);
          break;
        }

        if (
          provider === "gmail" &&
          (error.message.includes("timeout") ||
            error.message.includes("Connection timeout"))
        ) {
          console.log(`Gmail connection timeout, trying next provider...`);
          break;
        }

        if (attempt === retries && provider === providers[providers.length - 1]) {
          console.error("All email sending attempts with all providers failed");
          console.log("Using console fallback for email notification...");
          return logOTPToConsole(data);
        }

        if (error.message.includes("timeout") && attempt === retries) {
          console.log("Timeout error, using console fallback...");
          return logOTPToConsole(data);
        }

        if (attempt < retries) {
          const waitTime = attempt * 500;
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    if (provider !== providers[providers.length - 1]) {
      console.log(
        `All attempts with ${provider} failed, trying next provider...`
      );
    }
  }

  console.error("All email providers failed, using console fallback...");
  return logOTPToConsole(data);
};

export default sendMail;

