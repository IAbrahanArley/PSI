import emailjs from '@emailjs/browser';

export const useEmailService = () => {
  const sendEmail = async (form: HTMLFormElement) => {
    const serviceID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!;
    const templateID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!;

    try {
      const result = await emailjs.sendForm(serviceID, templateID, form, { publicKey });
      return { success: true, message: result.text };
    } catch (error: any) {
      return { success: false, message: error.text };
    }
  };

  return { sendEmail };
};