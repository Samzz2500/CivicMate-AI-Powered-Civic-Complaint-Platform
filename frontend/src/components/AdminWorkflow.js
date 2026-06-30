import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminWorkflow.css';

const AdminWorkflow = () => {
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // Form states
  const [assignForm, setAssignForm] = useState({
    departmentId: '',
    assignedToUserId: '',
    note: '',
    estimatedDays: 7
  });

  const [updateForm, setUpdateForm] = useState({
    stage: '',
    note: '',
    progressPercentage: 0,
    resolutionDetails: ''
  });

  const [verifyForm, setVerifyForm] = useState({
    approved: true,
    verifiedBy: '',
    note: ''
  });

  useEffect(() => {
    fetchComplaints();
    fetchDepartments();
  }, [filter]);

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/tweets`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { status: filter !== 'all' ? filter : undefined }
        }
      );
      setComplaints(response.data.tweets || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/departments`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setDepartments(response.data.departments || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const handleAssignDepartment = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/tracking/${selectedComplaint._id}/assign-department`,
        assignForm,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      alert('Complaint assigned successfully!');
      setShowAssignModal(false);
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign complaint');
    }
  };

  const handleUpdateStage = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/tracking/${selectedComplaint._id}/update-stage`,
        updateForm,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      alert('Stage updated successfully!');
      setShowUpdateModal(false);
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update stage');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/tracking/${selectedComplaint._id}/verify`,
        verifyForm,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      alert(verifyForm.approved ? 'Complaint verified successfully!' : 'Complaint sent back for rework');
      setShowVerifyModal(false);
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to verify complaint');
    }
  };

  const handleComplete = async (complaintId) => {
    if (!window.confirm('Mark this complaint as completed?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/tracking/${complaintId}/complete`,
        { note: 'Complaint successfully resolved and closed' },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      alert('Complaint marked as completed!');
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to complete complaint');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'submitted': '#ff9800',
      'assigned': '#2196f3',
      'in-progress': '#9c27b0',
      'under-review': '#ff5722',
      'resolved': '#4caf50',
      'verified': '#00bcd4',
      'completed': '#4caf50',
      'rejected': '#f44336'
    };
    return colors[status] || '#757575';
  };

  const getNextStages = (currentStatus) => {
    const stageFlow = {
      'submitted': ['assigned'],
      'assigned': ['inProgress'],
      'in-progress': ['underReview'],
      'under-review': ['resolved'],
      'resolved': ['verified'],
      'verified': ['completed']
    };
    return stageFlow[currentStatus] || [];
  };

  if (loading) {
    return <div className="admin-workflow-container"><div className="loading">Loading...</div></div>;
  }

  return (
    <div className="admin-workflow-container">
      <div className="workflow-header">
        <h1>Complaint Workflow Management</h1>
        <div className="filter-buttons">
          <button 
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={filter === 'submitted' ? 'active' : ''}
            onClick={() => setFilter('submitted')}
          >
            Submitted
          </button>
          <button 
            className={filter === 'assigned' ? 'active' : ''}
            onClick={() => setFilter('assigned')}
          >
            Assigned
          </button>
          <button 
            className={filter === 'in-progress' ? 'active' : ''}
            onClick={() => setFilter('in-progress')}
          >
            In Progress
          </button>
          <button 
            className={filter === 'resolved' ? 'active' : ''}
            onClick={() => setFilter('resolved')}
          >
            Resolved
          </button>
          <button 
            className={filter === 'verified' ? 'active' : ''}
            onClick={() => setFilter('verified')}
          >
            Verified
          </button>
        </div>
      </div>

      <div className="complaints-grid">
        {complaints.map(complaint => (
          <div key={complaint._id} className="complaint-card">
            <div className="card-header">
              <h3>{complaint.title}</h3>
              <span 
                className="status-badge" 
                style={{ backgroundColor: getStatusColor(complaint.completed) }}
              >
                {complaint.completed}
              </span>
            </div>
            
            <div className="card-body">
              <p className="complaint-description">{complaint.description}</p>
              <div className="complaint-meta">
                <span>📍 {complaint.location}</span>
                <span>📂 {complaint.category}</span>
                <span>👤 {complaint.user?.name}</span>
              </div>
              
              {complaint.department && (
                <div className="department-info">
                  <strong>Department:</strong> {complaint.department.name}
                </div>
              )}
              
              {complaint.assignedTo && (
                <div className="assigned-info">
                  <strong>Assigned To:</strong> {complaint.assignedTo.name}
                </div>
              )}
            </div>

            <div className="card-actions">
              {complaint.completed === 'submitted' && (
                <button 
                  className="btn-assign"
                  onClick={() => {
                    setSelectedComplaint(complaint);
                    setShowAssignModal(true);
                  }}
                >
                  Assign to Department
                </button>
              )}
              
              {getNextStages(complaint.completed).length > 0 && (
                <button 
                  className="btn-update"
                  onClick={() => {
                    setSelectedComplaint(complaint);
                    setUpdateForm({ ...updateForm, stage: getNextStages(complaint.completed)[0] });
                    setShowUpdateModal(true);
                  }}
                >
                  Update Stage
                </button>
              )}
              
              {complaint.completed === 'resolved' && (
                <button 
                  className="btn-verify"
                  onClick={() => {
                    setSelectedComplaint(complaint);
                    setShowVerifyModal(true);
                  }}
                >
                  Verify Resolution
                </button>
              )}
              
              {complaint.completed === 'verified' && (
                <button 
                  className="btn-complete"
                  onClick={() => handleComplete(complaint._id)}
                >
                  Mark as Completed
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {complaints.length === 0 && (
        <div className="no-complaints">
          No complaints found for the selected filter.
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Assign to Department</h2>
            <form onSubmit={handleAssignDepartment}>
              <div className="form-group">
                <label>Department:</label>
                <select 
                  value={assignForm.departmentId}
                  onChange={(e) => setAssignForm({...assignForm, departmentId: e.target.value})}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Estimated Days:</label>
                <input 
                  type="number"
                  value={assignForm.estimatedDays}
                  onChange={(e) => setAssignForm({...assignForm, estimatedDays: e.target.value})}
                  min="1"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Note:</label>
                <textarea 
                  value={assignForm.note}
                  onChange={(e) => setAssignForm({...assignForm, note: e.target.value})}
                  rows="3"
                />
              </div>
              
              <div className="modal-actions">
                <button type="submit" className="btn-primary">Assign</button>
                <button type="button" className="btn-secondary" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Stage Modal */}
      {showUpdateModal && (
        <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Update Workflow Stage</h2>
            <form onSubmit={handleUpdateStage}>
              <div className="form-group">
                <label>New Stage:</label>
                <select 
                  value={updateForm.stage}
                  onChange={(e) => setUpdateForm({...updateForm, stage: e.target.value})}
                  required
                >
                  <option value="">Select Stage</option>
                  {getNextStages(selectedComplaint?.completed).map(stage => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>
              
              {updateForm.stage === 'inProgress' && (
                <div className="form-group">
                  <label>Progress Percentage:</label>
                  <input 
                    type="number"
                    value={updateForm.progressPercentage}
                    onChange={(e) => setUpdateForm({...updateForm, progressPercentage: e.target.value})}
                    min="0"
                    max="100"
                  />
                </div>
              )}
              
              {updateForm.stage === 'resolved' && (
                <div className="form-group">
                  <label>Resolution Details:</label>
                  <textarea 
                    value={updateForm.resolutionDetails}
                    onChange={(e) => setUpdateForm({...updateForm, resolutionDetails: e.target.value})}
                    rows="3"
                    required
                  />
                </div>
              )}
              
              <div className="form-group">
                <label>Note:</label>
                <textarea 
                  value={updateForm.note}
                  onChange={(e) => setUpdateForm({...updateForm, note: e.target.value})}
                  rows="3"
                />
              </div>
              
              <div className="modal-actions">
                <button type="submit" className="btn-primary">Update</button>
                <button type="button" className="btn-secondary" onClick={() => setShowUpdateModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify Modal */}
      {showVerifyModal && (
        <div className="modal-overlay" onClick={() => setShowVerifyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Verify Resolution</h2>
            <form onSubmit={handleVerify}>
              <div className="form-group">
                <label>Decision:</label>
                <div className="radio-group">
                  <label>
                    <input 
                      type="radio"
                      checked={verifyForm.approved}
                      onChange={() => setVerifyForm({...verifyForm, approved: true})}
                    />
                    Approve
                  </label>
                  <label>
                    <input 
                      type="radio"
                      checked={!verifyForm.approved}
                      onChange={() => setVerifyForm({...verifyForm, approved: false})}
                    />
                    Reject (Send back for rework)
                  </label>
                </div>
              </div>
              
              <div className="form-group">
                <label>Verified By (Officer Name):</label>
                <input 
                  type="text"
                  value={verifyForm.verifiedBy}
                  onChange={(e) => setVerifyForm({...verifyForm, verifiedBy: e.target.value})}
                  placeholder="Main Officer Name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Note:</label>
                <textarea 
                  value={verifyForm.note}
                  onChange={(e) => setVerifyForm({...verifyForm, note: e.target.value})}
                  rows="3"
                  placeholder={verifyForm.approved ? "Verification notes" : "Reason for rejection"}
                  required
                />
              </div>
              
              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  {verifyForm.approved ? 'Verify' : 'Reject'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowVerifyModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWorkflow;
