
export const sendPasswordResetCode = async (email: string): Promise<void> => {
  const response = await api.post("/members/forgot-password/send-code", {
    email,
  });
  return response.data;
};


export const resetPassword = async (
  email: string,
  code: string,
  newPassword: string
): Promise<void> => {
  const response = await api.post("/members/forgot-password/reset", {
    email,
    code,
    newPassword,
  });
  return response.data;
};
