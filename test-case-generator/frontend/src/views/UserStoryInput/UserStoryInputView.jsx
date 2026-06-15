import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import './UserStoryInputView.css';
import { authFetch } from '../../utils/api';

/**
 * UserStoryInputView Component
 * Implements acceptance test scenarios for text entry, multi-checkbox selection,
 * empty form validation, and asynchronous loading states.
 */
export default function UserStoryInputView({ onGenerationComplete, onBack, projectId }) {
  // States mapping to acceptance test scenarios
  const [userStory, setUserStory] = useState('');
  const [testTypes, setTestTypes] = useState({
    positive: false,
    negative: false,
    edgeCase: false,
  });
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Scenario 2: Handles multi-selection capabilities for checkboxes independently
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setTestTypes((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  // Scenario 3 & 4: Form submission validation and processing lifecycles
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setWarning('');

    // Requirement: Must provide user story
    if (!userStory.trim()) {
      setError('User story requirement space cannot be empty.');
      return;
    }

    // Requirement: Must select at least one test type
    if (!testTypes.positive && !testTypes.negative && !testTypes.edgeCase) {
      setError('Please select at least one test type (Positive, Negative, or Edge Case).');
      return;
    }

    // Scenario 4: Trigger loading spinner state before initializing dispatch gateway
    setIsLoading(true);

    try {
      const response = await authFetch('/api/generate-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requirement: userStory,
          options: testTypes,
          projectId: projectId
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate test cases.');
      }

      // Scenario 2: Handle warning for missing product context
      if (data.message && data.message.includes('Warning')) {
        setWarning(data.message);
      }

      if (onGenerationComplete) {
        onGenerationComplete(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      // Deactivate loading spinner after async backend process finishes
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Navigation escape hatch back to the test cases overview */}
        <button 
          onClick={onBack}
          className="cursor-pointer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: '#f3f4f6', // gray-100
            border: '1px solid #d1d5db', // gray-300
            borderRadius: '8px',
            color: '#374151', // gray-700
            fontSize: '14px',
            fontWeight: '500',
            width: 'fit-content',
            transition: 'all 0.2s ease',
            marginBottom: '40px' // Increased spacing
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#e5e7eb';
            e.currentTarget.style.borderColor = '#9ca3af';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
            e.currentTarget.style.borderColor = '#d1d5db';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Test Cases</span>
        </button>

        <div className="flex justify-center">
          <div className="form-card">
            <h2>Generate Test Cases</h2>
            <p className="subtitle">Enter your user story and requirements below to construct automated scenarios.</p>

            <form onSubmit={handleSubmit} noValidate>
              {/* Scenario 3: Error notice block displayed dynamically */}
              {error && <div className="error-banner" role="alert" style={{ marginBottom: '1rem', padding: '12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', fontSize: '14px' }}>{error}</div>}
              
              {/* Scenario 2: Warning for missing context */}
              {warning && <div className="warning-banner" role="alert" style={{ marginBottom: '1rem', padding: '12px', background: '#fef3c7', color: '#92400e', borderRadius: '6px', fontSize: '14px' }}>{warning}</div>}

              {/* Scenario 1: Controlled user story requirement input area */}
              <div className="input-group">
                <label htmlFor="userStory">User Story / Text Requirement</label>
                <textarea
                  id="userStory"
                  rows="6"
                  value={userStory}
                  onChange={(e) => setUserStory(e.target.value)}
                  placeholder="As a user, I want to..."
                  disabled={isLoading}
                />
                {/* Scenario 1 confirmation check: Displays text in real-time below if needed */}
                <div className="live-preview">
                  <strong>Live Layout View:</strong> {userStory || <span className="placeholder">Empty input</span>}
                </div>
              </div>

              {/* Scenario 2: Multiple test types checkbox selection block */}
              <div className="input-group">
                <label>Test Generation Target Types</label>
                <div className="checkbox-cluster">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="positive"
                      checked={testTypes.positive}
                      onChange={handleCheckboxChange}
                      disabled={isLoading}
                    />
                    Positive Scenarios
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="negative"
                      checked={testTypes.negative}
                      onChange={handleCheckboxChange}
                      disabled={isLoading}
                    />
                    Negative Scenarios
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="edgeCase"
                      checked={testTypes.edgeCase}
                      onChange={handleCheckboxChange}
                      disabled={isLoading}
                    />
                    Edge Cases
                  </label>
                </div>
              </div>

              {/* Scenario 4: Submit control accompanied by a synchronized loading spinner */}
              <button 
                type="submit" 
                className="submit-btn" 
                disabled={isLoading}
                style={{ 
                  backgroundColor: '#7c3aed', // purple-600
                  color: '#ffffff',
                  transition: 'all 0.2s ease',
                  border: 'none'
                }}
                onMouseOver={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#6d28d9'; // purple-700
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#7c3aed'; // purple-600
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {isLoading ? (
                  <div className="spinner-wrapper">
                    <span className="spinner"></span>
                    Processing...
                  </div>
                ) : (
                  'Generate Test Cases'
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}