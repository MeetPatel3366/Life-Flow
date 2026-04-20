import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import Contact from "../models/contact.model.js";
import nodemailer from "nodemailer";

// Public — anyone can submit a contact message
export const createContact = asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;

  const contact = await Contact.create({ name, email, message });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        "Your message has been sent successfully. We will get back to you soon!",
        contact,
      ),
    );
});

// Admin — list all contact messages with pagination/filtering
export const getAllContacts = asyncHandler(async (req, res) => {
  const { status, search, page, limit, sortBy, sortOrder } = req.query;

  const filter = {};

  if (status) filter.status = status;

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: escapedSearch, $options: "i" } },
      { email: { $regex: escapedSearch, $options: "i" } },
      { message: { $regex: escapedSearch, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [contacts, totalCount] = await Promise.all([
    Contact.find(filter)
      .populate("repliedBy", "name email")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Contact.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return res.status(200).json(
    new ApiResponse(200, "Contact messages fetched successfully", {
      contacts,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    }),
  );
});

// Admin — get a single contact message
export const getContactById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const contact = await Contact.findById(id)
    .populate("repliedBy", "name email")
    .lean();

  if (!contact) {
    throw new ApiError(404, "Contact message not found");
  }

  // Mark as Read if currently Unread
  if (contact.status === "Unread") {
    await Contact.findByIdAndUpdate(id, { $set: { status: "Read" } });
    contact.status = "Read";
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Contact message fetched successfully", contact),
    );
});

// Admin — reply to a contact message (sends email)
export const replyToContact = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reply } = req.body;
  const adminId = req.user._id;

  const contact = await Contact.findById(id);

  if (!contact) {
    throw new ApiError(404, "Contact message not found");
  }

  // Send reply email
  const transporter = nodemailer.createTransport({
    host: process.env.MAILHOST,
    port: parseInt(process.env.MAILPORT, 10),
    secure: false,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.MAIL_USERNAME,
    to: contact.email,
    subject: "Life Flow - Reply to Your Message",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 24px; border-radius: 12px 12px 0 0;">
          <h2 style="color: white; margin: 0;">Life Flow</h2>
          <p style="color: rgba(255,255,255,0.85); margin: 4px 0 0 0; font-size: 14px;">Response to your inquiry</p>
        </div>
        <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="color: #374151;">Hello <strong>${contact.name}</strong>,</p>
          <p style="color: #6b7280; font-size: 14px;">Thank you for reaching out to us. Here is our response to your message:</p>
          
          <div style="background: #f9fafb; border-left: 4px solid #d1d5db; padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
            <p style="color: #6b7280; font-size: 13px; margin: 0 0 4px 0; font-weight: 600;">Your message:</p>
            <p style="color: #374151; margin: 0; font-size: 14px;">${contact.message}</p>
          </div>

          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
            <p style="color: #991b1b; font-size: 13px; margin: 0 0 4px 0; font-weight: 600;">Our reply:</p>
            <p style="color: #374151; margin: 0; font-size: 14px;">${reply}</p>
          </div>

          <p style="color: #6b7280; font-size: 14px;">If you have any further questions, feel free to reach out again.</p>
          <p style="color: #374151; font-size: 14px;">Best regards,<br><strong>The Life Flow Team</strong></p>
        </div>
        <div style="background: #f3f4f6; padding: 16px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Life Flow. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);

  // Update contact with reply details
  contact.adminReply = reply;
  contact.status = "Replied";
  contact.repliedAt = new Date();
  contact.repliedBy = adminId;
  await contact.save();

  const updatedContact = await Contact.findById(id)
    .populate("repliedBy", "name email")
    .lean();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Reply sent successfully to the user's email",
        updatedContact,
      ),
    );
});
