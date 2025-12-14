import JobApplication from "../models/JobApplication.js";

// Submit job application
export const submitJobApplication = async (req, res) => {
  try {
    const { jobId, jobTitle, jobCompany, applicantName, applicantEmail, coverLetter } = req.body;
    const userId = req.user.id;

    console.log('[JOB APPLICATION] Received request:', {
      jobId,
      jobTitle,
      applicantName,
      applicantEmail,
      filePresent: !!req.file,
      fileName: req.file?.filename,
      filePath: req.file?.path,
      userId
    });

    // Validate required fields
    if (!jobId || !jobTitle || !jobCompany || !applicantName || !applicantEmail) {
      console.error('[JOB APPLICATION] Missing required fields');
      return res.status(400).json({
        success: false,
        message: "Missing required fields: jobId, jobTitle, jobCompany, applicantName, applicantEmail",
      });
    }

    // Check if resume is uploaded
    if (!req.file) {
      console.error('[JOB APPLICATION] No resume file uploaded');
      console.error('[JOB APPLICATION] req.file:', req.file);
      console.error('[JOB APPLICATION] req.files:', req.files);
      console.error('[JOB APPLICATION] req.body keys:', Object.keys(req.body));
      return res.status(400).json({
        success: false,
        message: "Resume file is required. Please upload a PDF, DOC, or DOCX file.",
      });
    }

    // Check if user already applied for this job
    const existingApplication = await JobApplication.findOne({
      userId,
      jobId,
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "You have already applied for this job",
      });
    }

    // Create new application
    const application = new JobApplication({
      userId,
      jobId,
      jobTitle,
      jobCompany,
      applicantName,
      applicantEmail,
      coverLetter: coverLetter || "",
      resumePath: req.file.path,
      resumeFileName: req.file.filename,
      status: "pending",
    });

    await application.save();

    console.log('[JOB APPLICATION] Application saved successfully:', application._id);

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: application,
    });
  } catch (error) {
    console.error("[JOB APPLICATION] Error:", error.message);
    console.error("[JOB APPLICATION] Stack:", error.stack);
    res.status(500).json({
      success: false,
      message: error.message || "Error submitting application",
    });
  }
};

// Get user's applications
export const getUserApplications = async (req, res) => {
  try {
    const userId = req.user.id;

    const applications = await JobApplication.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: applications,
    });
  } catch (error) {
    console.error("Get applications error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching applications",
    });
  }
};

// Get all applications (admin)
export const getAllApplications = async (req, res) => {
  try {
    const { status, jobId, page = 1, limit = 10 } = req.query;

    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only",
      });
    }

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (jobId) filter.jobId = parseInt(jobId);

    // Fetch with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const applications = await JobApplication.find(filter)
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await JobApplication.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get all applications error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching applications",
    });
  }
};

// Approve job application (admin)
export const approveJobApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only",
      });
    }

    const application = await JobApplication.findByIdAndUpdate(
      applicationId,
      { status: "accepted" },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Application approved successfully",
      data: application,
    });
  } catch (error) {
    console.error("Approve application error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error approving application",
    });
  }
};

// Reject/Cancel job application (admin)
export const rejectJobApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { reason } = req.body;

    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only",
      });
    }

    const application = await JobApplication.findByIdAndUpdate(
      applicationId,
      { 
        status: "rejected",
        rejectionReason: reason || "Application rejected"
      },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Application rejected successfully",
      data: application,
    });
  } catch (error) {
    console.error("Reject application error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error rejecting application",
    });
  }
};
