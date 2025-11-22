'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Camera, 
  Upload,
  User,
  CreditCard,
  Shield
} from 'lucide-react'
import { DocumentCapture } from './DocumentCapture'
import { SelfieCapture } from './SelfieCapture'

// Web3-style verification wizard with step-by-step guided flow
// — Royette
interface VerificationWizardProps {
  onComplete: (data: any) => void
}

const STEPS = [
  { id: 1, title: 'Personal Information', icon: User },
  { id: 2, title: 'Government ID', icon: CreditCard },
  { id: 3, title: 'Selfie Verification', icon: Camera },
  { id: 4, title: 'Review & Submit', icon: Shield },
]

export function VerificationWizard({ onComplete }: VerificationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    idType: 'PASSPORT',
    governmentIdNumber: '',
  })
  const [files, setFiles] = useState<{
    governmentId?: File
    liveness?: File
  }>({})

  const nextStep = () => {
    console.log('roy: Next button clicked, current step:', currentStep)
    console.log('roy: Current files state:', files)
    console.log('roy: Can proceed?', canProceed())
    
    if (currentStep < STEPS.length && canProceed()) {
      console.log('roy: Moving to step:', currentStep + 1)
      setCurrentStep((prev) => prev + 1)
    } else {
      console.log('roy: Cannot proceed - validation failed or at last step')
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = () => {
    let result = false
    switch (currentStep) {
      case 1:
        result = !!(formData.firstName && formData.lastName && formData.dateOfBirth && formData.governmentIdNumber)
        break
      case 2:
        result = !!files.governmentId
        break
      case 3:
        result = !!files.liveness
        console.log('roy: Step 3 canProceed check:', { hasLiveness: !!files.liveness, files })
        break
      case 4:
        result = true
        break
      default:
        result = false
    }
    console.log(`roy: Step ${currentStep} canProceed:`, result)
    return result
  }

  const handleSubmit = () => {
    onComplete({
      ...formData,
      files,
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id
            
            return (
              <div key={step.id} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                      isActive
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : isCompleted
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'bg-gray-100 border-gray-300 text-gray-500'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium text-center ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card className="border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {STEPS[currentStep - 1].title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Please enter your personal information exactly as it appears on your government-issued ID.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <Input
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    required
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <Input
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    required
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfBirth: e.target.value })
                  }
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Type *
                </label>
                <Select
                  value={formData.idType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, idType: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PASSPORT">Passport</SelectItem>
                    <SelectItem value="DRIVER_LICENSE">Driver's License</SelectItem>
                    <SelectItem value="NATIONAL_ID">National ID</SelectItem>
                    <SelectItem value="VISA">Visa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.idType.replace('_', ' ')} Number *
                </label>
                <Input
                  placeholder="Enter your ID number"
                  value={formData.governmentIdNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, governmentIdNumber: e.target.value })
                  }
                  required
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Step 2: Government ID Capture */}
          {currentStep === 2 && (
            <DocumentCapture
              idType={formData.idType}
              onCapture={(file) => {
                setFiles({ ...files, governmentId: file })
              }}
              existingFile={files.governmentId}
            />
          )}

          {/* Step 3: Selfie Capture */}
          {currentStep === 3 && (
            <SelfieCapture
              onCapture={(file) => {
                console.log('roy: Selfie captured in wizard:', file?.name, file?.size)
                setFiles((prev) => {
                  const updated = { ...prev, liveness: file }
                  console.log('roy: Updated files state:', { 
                    hasGovernmentId: !!updated.governmentId,
                    hasLiveness: !!updated.liveness 
                  })
                  return updated
                })
              }}
              existingFile={files.liveness}
            />
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-lg text-gray-900">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">First Name:</span>
                    <p className="font-medium">{formData.firstName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Name:</span>
                    <p className="font-medium">{formData.lastName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Date of Birth:</span>
                    <p className="font-medium">
                      {new Date(formData.dateOfBirth).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">ID Type:</span>
                    <p className="font-medium">{formData.idType.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-lg text-gray-900">Documents</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Government ID:</span>
                    <span className="font-medium text-green-600 flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      {files.governmentId?.name || 'Uploaded'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Selfie:</span>
                    <span className="font-medium text-green-600 flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      {files.liveness?.name || 'Uploaded'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  By submitting, you confirm that all information provided is accurate and that you agree to our verification process.
                </p>
              </div>
            </div>
          )}
        </CardContent>

        {/* Navigation */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          {currentStep < STEPS.length ? (
            <div className="flex flex-col items-end">
              {!canProceed() && currentStep === 3 && (
                <p className="text-xs text-red-600 mb-2">
                  {files.liveness ? 'Processing...' : 'Please capture or upload your selfie first'}
                </p>
              )}
              <Button
                onClick={() => {
                  console.log('roy: Next button clicked at step:', currentStep)
                  console.log('roy: Files state:', { hasLiveness: !!files.liveness })
                  console.log('roy: Can proceed:', canProceed())
                  nextStep()
                }}
                disabled={!canProceed()}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed()}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
            >
              <Shield className="w-4 h-4" />
              <span>Submit Verification</span>
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

