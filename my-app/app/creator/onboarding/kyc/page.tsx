'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, CheckCircle, ChevronRight, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DocumentCapture } from '@/components/kyc/DocumentCapture'
import { SelfieCapture } from '@/components/kyc/SelfieCapture'

// Steps for the KYC wizard
const STEPS = {
  PERSONAL_INFO: 1,
  ID_UPLOAD: 2,
  SELFIE_UPLOAD: 3,
  REVIEW: 4,
}

export default function CreatorKYCPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(STEPS.PERSONAL_INFO)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    idType: '',
    governmentIdNumber: '',
  })

  // File State
  const [idFile, setIdFile] = useState<File | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const nextStep = () => {
    // Validation for Step 1
    if (currentStep === STEPS.PERSONAL_INFO) {
      if (
        !formData.firstName ||
        !formData.lastName ||
        !formData.dateOfBirth ||
        !formData.idType ||
        !formData.governmentIdNumber
      ) {
        toast.error('Please fill in all fields')
        return
      }
    }

    // Validation for Step 2
    if (currentStep === STEPS.ID_UPLOAD && !idFile) {
      toast.error('Please capture your ID')
      return
    }

    // Validation for Step 3
    if (currentStep === STEPS.SELFIE_UPLOAD && !selfieFile) {
      toast.error('Please take a selfie')
      return
    }

    setCurrentStep((prev) => prev + 1)
  }

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1)
  }

  const uploadFile = async (file: File, docType: 'id' | 'selfie') => {
    try {
      // 1. Get Presigned URL
      const res = await fetch('/api/kyc/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileType: file.type,
          docType,
        }),
      })

      if (!res.ok) throw new Error('Failed to get upload URL')
      const { uploadUrl, fileKey } = await res.json()

      // 2. Upload to S3
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })

      if (!uploadRes.ok) throw new Error('Failed to upload file')

      return fileKey
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      if (!idFile || !selfieFile) throw new Error('Missing files')

      // Upload files first
      const governmentIdKey = await uploadFile(idFile, 'id')
      const livelinessKey = await uploadFile(selfieFile, 'selfie')

      // Submit KYC data
      const res = await fetch('/api/kyc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          governmentIdKey,
          livelinessKey,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit KYC')
      }

      toast.success('KYC Submitted Successfully!')
      router.push('/creator/dashboard?kyc=pending')
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <ShieldCheck className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
            Identity Verification
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            To ensure safety on our platform, we need to verify your identity.
            <br />
            Your data is stored securely and never shared publicly.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex items-center ${
                  step !== 4 ? 'flex-1' : ''
                } ${step < 4 ? 'max-w-[100px]' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                    step <= currentStep
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 text-gray-500'
                  }`}
                >
                  {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
                </div>
                {step < 4 && (
                  <div
                    className={`h-1 w-full mx-2 ${
                      step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2 px-2">
            <span>Personal Info</span>
            <span>ID Photo</span>
            <span>Selfie</span>
            <span>Review</span>
          </div>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Step 1: Personal Info */}
          {currentStep === STEPS.PERSONAL_INFO && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Jane"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="idType">ID Type</Label>
                  <Select
                    value={formData.idType}
                    onValueChange={(val) => handleSelectChange('idType', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PASSPORT">Passport</SelectItem>
                      <SelectItem value="DRIVER_LICENSE">Driver's License</SelectItem>
                      <SelectItem value="NATIONAL_ID">National ID</SelectItem>
                      <SelectItem value="VISA">Visa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="governmentIdNumber">ID Number</Label>
                  <Input
                    id="governmentIdNumber"
                    name="governmentIdNumber"
                    value={formData.governmentIdNumber}
                    onChange={handleInputChange}
                    placeholder="Enter your ID number"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: ID Upload */}
          {currentStep === STEPS.ID_UPLOAD && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Upload Government ID</h3>
              <p className="text-sm text-gray-500">
                Please take a clear photo of your {formData.idType?.replace('_', ' ').toLowerCase()}.
                Make sure all text is readable.
              </p>
              <DocumentCapture
                idType={formData.idType}
                onCapture={setIdFile}
                existingFile={idFile || undefined}
              />
            </div>
          )}

          {/* Step 3: Selfie Upload */}
          {currentStep === STEPS.SELFIE_UPLOAD && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Take a Selfie</h3>
              <p className="text-sm text-gray-500">
                We need to verify that you are the person in the ID. Please take a selfie now.
              </p>
              <SelfieCapture
                onCapture={setSelfieFile}
                existingFile={selfieFile || undefined}
              />
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === STEPS.REVIEW && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Review & Submit</h3>
              <div className="bg-gray-50 p-4 rounded-md space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-500">Name:</span>
                  <span className="font-medium">{formData.firstName} {formData.lastName}</span>
                  
                  <span className="text-gray-500">DOB:</span>
                  <span className="font-medium">{formData.dateOfBirth}</span>
                  
                  <span className="text-gray-500">ID Type:</span>
                  <span className="font-medium">{formData.idType}</span>
                  
                  <span className="text-gray-500">ID Number:</span>
                  <span className="font-medium">{formData.governmentIdNumber}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-sm font-medium mb-2">Documents Ready:</p>
                  <div className="flex space-x-4">
                    <div className="flex items-center text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4 mr-1" /> ID Photo
                    </div>
                    <div className="flex items-center text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4 mr-1" /> Selfie
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1 || isSubmitting}
              className={currentStep === 1 ? 'invisible' : ''}
            >
              Back
            </Button>

            {currentStep < STEPS.REVIEW ? (
              <Button onClick={nextStep}>
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Verification'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
