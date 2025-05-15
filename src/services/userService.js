const prisma = require('../utils/prisma');
const bcrypt = require("bcrypt");
const createUser = async (data) => {
  const hashedPassword = await bcrypt.hash(data.password, 12);
  return prisma.user.create({ data: { ...data, password: hashedPassword } });
};
const findUserByEmail = async (email) => {
  return prisma.user.findUnique({ where: { email } });
};

const updateUserPassword = async (userId, hashedPassword) => {
  return prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
};

const storeOtp = async (userId, otp, expiresAt) => {
  try {
    const expirationDate = new Date(expiresAt);

    await prisma.otp.create({
      data: {
        userId,
        otp,
        expiresAt: expirationDate
      }
    });
  } catch (error) {
    console.error("Error storing OTP:", error);
    throw error;
  }
};


const getStoredOtp = async (userId) => {
  try {
    const otp = await prisma.otp.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      throw new Error("No OTP found for this user.");
    }
    if (Date.now() > otp.expiresAt.getTime()) {
      throw new Error("OTP has expired.");
    }

    return otp;
  } catch (error) {
    console.error("Error fetching OTP:", error);
    throw error;
  }
};

module.exports = { createUser, findUserByEmail,updateUserPassword, storeOtp, getStoredOtp};