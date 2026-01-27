import { Resend } from "resend";
import { envConfig } from "../../config/config.js";

const resend = new Resend(envConfig.resendApiKey as string);

export const sendOtp = async (email: string, otp: string) => {
  const { data, error } = await resend.emails.send({
    from: "Brothers Shoe <onboarding@asbin.site>",
    to: [email],
    subject: "Verification Code",
    html: `<p>Your verification code is <strong>${otp}</strong></p>`,
  });

  if (error) {
    console.error({ error });
    return false;
  }

  console.log({ data });
  return true;
};
