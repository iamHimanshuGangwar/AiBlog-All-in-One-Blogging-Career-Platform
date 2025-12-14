import Job from "../models/Job.js";
import JobApplication from "../models/JobApplication.js";

// =================== CREATE JOB (Admin) ===================
export const createJob = async (req, res) => {
  try {
    const { title, company, location, salary, jobType, industry, description, requirements, benefits, applicationDeadline } = req.body;

    // Validate required fields
    if (!title || !company || !location || !salary || !jobType || !industry || !description) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only admins can post jobs",
      });
    }

    const job = await Job.create({
      title,
      company,
      location,
      salary,
      jobType,
      industry,
      description,
      requirements: requirements || "",
      benefits: benefits || "",
      applicationDeadline: applicationDeadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      postedBy: req.user.id,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Job posted successfully",
      data: job,
    });
  } catch (error) {
    console.error("Create job error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error creating job",
    });
  }
};

// =================== GET ALL JOBS (Public) ===================
export const getAllJobs = async (req, res) => {
  try {
    const { search, industry, jobType, page = 1, limit = 10 } = req.query;

    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    if (industry) filter.industry = industry;
    if (jobType) filter.jobType = jobType;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const jobs = await Job.find(filter)
      .populate("postedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get all jobs error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching jobs",
    });
  }
};

// =================== GET SINGLE JOB ===================
export const getJobById = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId).populate("postedBy", "name email");

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error("Get job error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching job",
    });
  }
};

// =================== UPDATE JOB (Admin) ===================
export const updateJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { title, company, location, salary, jobType, industry, description, requirements, benefits, applicationDeadline, isActive } = req.body;

    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only admins can update jobs",
      });
    }

    const job = await Job.findByIdAndUpdate(
      jobId,
      {
        title,
        company,
        location,
        salary,
        jobType,
        industry,
        description,
        requirements,
        benefits,
        applicationDeadline,
        isActive,
      },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Job updated successfully",
      data: job,
    });
  } catch (error) {
    console.error("Update job error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error updating job",
    });
  }
};

// =================== DELETE JOB (Admin) ===================
export const deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only admins can delete jobs",
      });
    }

    const job = await Job.findByIdAndDelete(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Also delete all applications for this job
    await JobApplication.deleteMany({ jobId: job._id });

    res.status(200).json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("Delete job error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error deleting job",
    });
  }
};

// =================== GET ALL JOBS (Admin) ===================
export const getAllJobsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only admins can access this",
      });
    }

    const filter = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const jobs = await Job.find(filter)
      .populate("postedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get admin jobs error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching jobs",
    });
  }
};
