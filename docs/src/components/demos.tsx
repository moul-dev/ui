'use client'

import React, { useState } from 'react'
import {
  Button,
  ModalOverlay,
  Modal,
  AlertDialog,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useToast,
  ToastContainer,
  Form,
  TextField,
  Alert,
} from '@moul-dev/ui'

export function AlertDialogDemo() {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <>
      <Button variant="danger" onPress={() => setIsOpen(true)}>
        Deactivate Account
      </Button>
      <ModalOverlay isOpen={isOpen} onOpenChange={setIsOpen}>
        <Modal>
          <AlertDialog>
            <AlertDialogHeader>Deactivate Account</AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to deactivate your account? This action
              cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button variant="outline" onPress={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onPress={() => setIsOpen(false)}>
                Confirm
              </Button>
            </AlertDialogFooter>
          </AlertDialog>
        </Modal>
      </ModalOverlay>
    </>
  )
}

export function ModalDemo() {
  const [isOpen, setIsOpen] = useState(false)
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md')

  const openModal = (sz: 'sm' | 'md' | 'lg') => {
    setSize(sz)
    setIsOpen(true)
  }

  return (
    <div className="flex gap-4">
      <Button variant="outline" onPress={() => openModal('sm')}>
        Open Small
      </Button>
      <Button onPress={() => openModal('md')}>Open Medium</Button>
      <Button variant="secondary" onPress={() => openModal('lg')}>
        Open Large
      </Button>

      <ModalOverlay isOpen={isOpen} onOpenChange={setIsOpen}>
        <Modal size={size}>
          <ModalDialog>
            <ModalHeader>Modal Title ({size.toUpperCase()})</ModalHeader>
            <ModalBody>
              This is the content inside the {size} size Modal.
            </ModalBody>
            <ModalFooter>
              <Button onPress={() => setIsOpen(false)}>Close</Button>
            </ModalFooter>
          </ModalDialog>
        </Modal>
      </ModalOverlay>
    </div>
  )
}

export function ToastDemo() {
  const toast = useToast()
  return (
    <div className="flex flex-wrap gap-4">
      <Button
        variant="outline"
        onPress={() =>
          toast.show('Info Notification', {
            description: 'This is a general informational message.',
            variant: 'info',
          })
        }
      >
        Info Toast
      </Button>
      <Button
        onPress={() =>
          toast.show('Success Notification', {
            description: 'Action completed successfully.',
            variant: 'success',
          })
        }
        variant="outline"
      >
        Success Toast
      </Button>
      <Button
        variant="outline"
        onPress={() =>
          toast.show('Warning Notification', {
            description: 'Please review your input values.',
            variant: 'warning',
          })
        }
      >
        Warning Toast
      </Button>
      <Button
        variant="outline"
        onPress={() =>
          toast.show('Error Notification', {
            description: 'Failed to process request. Please try again.',
            variant: 'error',
          })
        }
      >
        Error Toast
      </Button>
      <ToastContainer />
    </div>
  )
}

export function FormDemo() {
  return (
    <Form onSubmit={(e) => e.preventDefault()} className="w-72 space-y-4">
      <TextField label="Username" placeholder="Enter username" />
      <Button type="submit">Submit</Button>
    </Form>
  )
}

export function AlertDemo() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) {
    return (
      <div className="flex justify-center p-4">
        <Button variant="outline" onPress={() => setIsVisible(true)}>
          Reset Alert Demo
        </Button>
      </div>
    )
  }

  return (
    <Alert
      variant="success"
      title="Profile updated successfully"
      onClose={() => setIsVisible(false)}
    />
  )
}
