const mongoose = require("mongoose");

const DepartmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100
  },
  nameMarathi: {
    type: String,
    trim: true,
    maxlength: 100,
    description: "Department name in Marathi"
  },
  description: {
    type: String,
    maxlength: 500
  },
  categories: [{
    type: String,
    enum: ["drainage", "garbage", "potholes", "public washroom", "streetlight", "water_leakage", "others"]
  }],
  staff: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  head: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    description: "Department head/manager"
  },
  contactEmail: {
    type: String,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  contactPhone: {
    type: String,
    trim: true,
    match: /^[0-9]{10}$/
  },
  officeAddress: {
    type: String,
    maxlength: 300
  },
  workingHours: {
    start: {
      type: String,
      default: "09:00"
    },
    end: {
      type: String,
      default: "18:00"
    },
    workingDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    }
  },
  sla: {
    responseTime: {
      type: Number,
      default: 24,
      description: "Expected response time in hours"
    },
    resolutionTime: {
      type: Number,
      default: 168,
      description: "Expected resolution time in hours (7 days default)"
    }
  },
  statistics: {
    totalAssigned: {
      type: Number,
      default: 0
    },
    totalCompleted: {
      type: Number,
      default: 0
    },
    averageResolutionTime: {
      type: Number,
      default: 0,
      description: "Average resolution time in hours"
    },
    satisfactionRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    }
  },
  active: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
DepartmentSchema.index({ name: 1, active: 1 });
DepartmentSchema.index({ categories: 1, active: 1 });

// Method to assign complaint
DepartmentSchema.methods.assignComplaint = async function(tweetId) {
  this.statistics.totalAssigned += 1;
  await this.save();
  
  // TODO: Notify department staff
  return this;
};

// Method to mark complaint as completed
DepartmentSchema.methods.completeComplaint = async function(resolutionTimeHours) {
  this.statistics.totalCompleted += 1;
  
  // Update average resolution time
  const total = this.statistics.totalCompleted;
  const currentAvg = this.statistics.averageResolutionTime;
  this.statistics.averageResolutionTime = 
    ((currentAvg * (total - 1)) + resolutionTimeHours) / total;
  
  await this.save();
  return this;
};

// Method to update satisfaction rating
DepartmentSchema.methods.updateSatisfaction = async function(newRating) {
  const total = this.statistics.totalCompleted;
  const currentRating = this.statistics.satisfactionRating;
  
  this.statistics.satisfactionRating = 
    ((currentRating * (total - 1)) + newRating) / total;
  
  await this.save();
  return this;
};

// Static method to get department by category
DepartmentSchema.statics.findByCategory = async function(category) {
  return this.findOne({ 
    categories: category, 
    active: true 
  });
};

// Static method to get department statistics
DepartmentSchema.statics.getStatistics = async function() {
  return this.aggregate([
    { $match: { active: true } },
    {
      $project: {
        name: 1,
        totalAssigned: '$statistics.totalAssigned',
        totalCompleted: '$statistics.totalCompleted',
        averageResolutionTime: '$statistics.averageResolutionTime',
        satisfactionRating: '$statistics.satisfactionRating',
        completionRate: {
          $cond: [
            { $eq: ['$statistics.totalAssigned', 0] },
            0,
            {
              $multiply: [
                { $divide: ['$statistics.totalCompleted', '$statistics.totalAssigned'] },
                100
              ]
            }
          ]
        }
      }
    },
    { $sort: { satisfactionRating: -1 } }
  ]);
};

module.exports = mongoose.model("Department", DepartmentSchema);
