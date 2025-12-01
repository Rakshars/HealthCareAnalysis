import { useState } from 'react';
import { Upload as UploadIcon, FileText, CheckCircle, XCircle, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import PieChartCard from '../components/PieChartCard';

export default function Upload() {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadedData, setUploadedData] = useState(null);
  const { user, saveUserUpload } = useAuth();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    if (!file.name.endsWith('.csv')) {
      setUploadResult({ success: false, message: 'Please upload a CSV file only.' });
      return;
    }

    setUploading(true);
    setUploadResult(null);
    setUploadedData(null);

    try {
      console.log('Starting file upload:', file.name);
      const result = await api.uploadFile(file, user?.id);
      console.log('Upload result:', result);
      
      // Add file statistics to the result
      const fileStats = {
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(2) + ' KB',
        uploadDate: new Date().toISOString()
      };
      
      setUploadResult({ ...result, ...fileStats });
      
      if (result.success) {
        // Save upload to user's history
        try {
          saveUserUpload({
            fileName: file.name,
            data_id: result.data_id,
            metrics: result.uploadData?.metrics
          });
        } catch (saveError) {
          console.warn('Failed to save upload to user history:', saveError);
        }
        
        // Fetch and display health data immediately
        try {
          const [metrics, diseaseData] = await Promise.all([
            api.getMetrics(),
            api.getDiseaseData()
          ]);
          
          setUploadedData({
            ...fileStats,
            data_id: result.data_id,
            metrics,
            diseaseData
          });
        } catch (dataError) {
          console.warn('Failed to fetch health data:', dataError);
          setUploadedData({ ...fileStats, data_id: result.data_id });
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({ 
        success: false, 
        message: error.message || 'Upload failed. Please try again.' 
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold dark:text-white text-slate-900">Upload Health Data</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-gradient border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold dark:text-white text-slate-900 mb-6">Upload CSV File</h2>
          
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
              dragActive 
                ? 'border-neon-blue bg-neon-blue/10 neon-glow' 
                : 'border-gray-600 hover:border-gray-500'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
            
            <div className="space-y-4">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
                uploading ? 'bg-neon-blue/20 animate-pulse' : 'bg-gray-700'
              }`}>
                <UploadIcon className={`w-8 h-8 ${uploading ? 'text-neon-blue animate-bounce' : 'text-gray-400'}`} />
              </div>
              
              <div>
                <p className="text-lg font-medium dark:text-white text-slate-900">
                  {uploading ? 'Uploading...' : 'Drop your CSV file here'}
                </p>
                <p className="dark:text-gray-400 text-slate-900 mt-1">
                  or click to browse files
                </p>
              </div>
              
              <button
                disabled={uploading}
                className="bg-gradient-to-r from-neon-blue to-neon-purple text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg hover:shadow-neon-blue/25 transition-all duration-300 disabled:opacity-50"
              >
                {uploading ? 'Processing...' : 'Select File'}
              </button>
            </div>
          </div>

          {uploadResult && (
            <div className={`mt-6 p-4 rounded-lg border ${
              uploadResult.success 
                ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              <div className="flex items-center space-x-2">
                {uploadResult.success ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                <span className="font-medium">
                  {uploadResult.success ? 'Upload Successful!' : 'Upload Failed!'}
                </span>
              </div>
              <p className="mt-1 text-sm">{uploadResult.message}</p>
              
              {uploadResult.success && (
                <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="opacity-75">File:</span>
                    <p className="font-medium">{uploadResult.fileName}</p>
                  </div>
                  <div>
                    <span className="opacity-75">Size:</span>
                    <p className="font-medium">{uploadResult.fileSize}</p>
                  </div>
                  <div>
                    <span className="opacity-75">Data ID:</span>
                    <p className="font-mono text-xs">{uploadResult.data_id}</p>
                  </div>
                  <div>
                    <span className="opacity-75">Uploaded:</span>
                    <p className="font-medium">{new Date(uploadResult.uploadDate).toLocaleTimeString()}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card-gradient border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold dark:text-white text-slate-900 mb-6">File Requirements</h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <FileText className="w-5 h-5 text-neon-blue mt-0.5" />
              <div>
                <h3 className="font-medium dark:text-white text-slate-900">CSV Format</h3>
                <p className="text-sm text-gray-400">Files must be in CSV format with proper headers</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-neon-green mt-0.5" />
              <div>
                <h3 className="font-medium dark:text-white text-slate-900">Required Columns</h3>
                <p className="text-sm text-gray-400">user_id, date, metric, value</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <UploadIcon className="w-5 h-5 text-neon-purple mt-0.5" />
              <div>
                <h3 className="font-medium dark:text-white text-slate-900">File Size</h3>
                <p className="text-sm text-gray-400">Maximum file size: 10MB</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h4 className="text-neon-blue font-medium mb-2">Sample Data Format</h4>
            <pre className="text-xs text-gray-300 overflow-x-auto">
{`user_id,date,metric,value,type,notes
u001,2024-01-15,steps,8500,walking,Morning jog
u001,2024-01-15,heart_rate,72,resting,After breakfast
u001,2024-01-15,sleep,7.5,,Good night sleep`}
            </pre>
          </div>
        </div>
      </div>

      {uploadedData && (
        <div className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Upload Statistics & Analysis</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <BarChart3 className="w-4 h-4" />
              <span>Real-time processed data</span>
            </div>
          </div>
          
          {/* File Statistics */}
          <div className="card-gradient border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">File Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-neon-blue">{uploadedData.fileName?.split('.')[0] || 'N/A'}</div>
                <div className="text-sm text-gray-400">File Name</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neon-green">{uploadedData.fileSize || 'N/A'}</div>
                <div className="text-sm text-gray-400">File Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neon-purple">{uploadedData.metrics?.totalPatients || 0}</div>
                <div className="text-sm text-gray-400">Records</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">CSV</div>
                <div className="text-sm text-gray-400">Format</div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-gradient border border-neon-blue/30 rounded-lg p-4">
              <h3 className="text-neon-blue font-semibold">Total Users</h3>
              <p className="text-2xl font-bold dark:text-white text-slate-900">{uploadedData.metrics?.totalPatients || 0}</p>
            </div>
            <div className="card-gradient border border-neon-green/30 rounded-lg p-4">
              <h3 className="text-neon-green font-semibold">Avg Steps/Day</h3>
              <p className="text-2xl font-bold dark:text-white text-slate-900">{uploadedData.metrics?.avgSteps?.toLocaleString() || '0'}</p>
              <p className="text-xs text-gray-400 mt-1">{uploadedData.metrics?.stepsChange > 0 ? '↗' : uploadedData.metrics?.stepsChange < 0 ? '↘' : '→'} {Math.abs(uploadedData.metrics?.stepsChange || 0)}%</p>
            </div>
            <div className="card-gradient border border-neon-purple/30 rounded-lg p-4">
              <h3 className="text-neon-purple font-semibold">Avg Heart Rate</h3>
              <p className="text-2xl font-bold dark:text-white text-slate-900">{uploadedData.metrics?.avgHeartRate || 0} BPM</p>
              <p className="text-xs text-gray-400 mt-1">{uploadedData.metrics?.heartRateChange > 0 ? '↗' : uploadedData.metrics?.heartRateChange < 0 ? '↘' : '→'} {Math.abs(uploadedData.metrics?.heartRateChange || 0)}%</p>
            </div>
            <div className="card-gradient border border-yellow-500/30 rounded-lg p-4">
              <h3 className="text-yellow-400 font-semibold">Avg Sleep</h3>
              <p className="text-2xl font-bold dark:text-white text-slate-900">{uploadedData.metrics?.avgSleep || 0}h</p>
              <p className="text-xs text-gray-400 mt-1">{uploadedData.metrics?.sleepChange > 0 ? '↗' : uploadedData.metrics?.sleepChange < 0 ? '↘' : '→'} {Math.abs(uploadedData.metrics?.sleepChange || 0)}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="card-gradient border border-blue-500/30 rounded-lg p-4">
              <h3 className="text-blue-400 font-semibold">Active Users</h3>
              <p className="text-2xl font-bold dark:text-white text-slate-900">{uploadedData.metrics?.activePatients || 0}</p>
              <p className="text-sm text-gray-400">6000+ steps/day</p>
            </div>
            <div className="card-gradient border border-green-500/30 rounded-lg p-4">
              <h3 className="text-green-400 font-semibold">Avg Water</h3>
              <p className="text-2xl font-bold dark:text-white text-slate-900">{uploadedData.metrics?.avgWater || 0}L</p>
              <p className="text-sm text-gray-400">per day</p>
            </div>
            <div className="card-gradient border border-red-500/30 rounded-lg p-4">
              <h3 className="text-red-400 font-semibold">Health Alerts</h3>
              <p className="text-2xl font-bold dark:text-white text-slate-900">{uploadedData.metrics?.criticalCases || 0}</p>
              <p className="text-sm text-gray-400">need attention</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PieChartCard
              title="Health Status Distribution"
              data={uploadedData.diseaseData || []}
            />
            
            <div className="card-gradient border border-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-semibold dark:text-white text-slate-900 mb-4">Processing Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Processing Status:</span>
                  <span className="text-green-400 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Successfully Processed
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Data Quality:</span>
                  <span className="text-green-400">✓ Valid Format</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Metrics Detected:</span>
                  <span className="text-white">Steps, Heart Rate, Sleep, Water</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Upload Time:</span>
                  <span className="text-white">{new Date(uploadedData.uploadDate).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Data ID:</span>
                  <span className="text-white font-mono text-xs">{uploadedData.data_id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}