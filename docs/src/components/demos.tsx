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
  TagGroup,
  Tag,
  ComboBox,
  ComboBoxItem,
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

export function TagGroupDemo() {
  const [selected, setSelected] = useState<any>(new Set(['travel']))
  const [tags, setTags] = useState([
    { id: 'news', label: 'News' },
    { id: 'travel', label: 'Travel' },
    { id: 'gaming', label: 'Gaming' },
    { id: 'shopping', label: 'Shopping' },
  ])

  const handleRemove = (keys: Set<any>) => {
    setTags((prev) => prev.filter((tag) => !keys.has(tag.id)))
  }

  return (
    <div className="w-full max-w-xl flex flex-col gap-6 p-2">
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Variants (Primary, Secondary, Tertiary)</h3>
        <div className="flex flex-col gap-3">
          <TagGroup label="Primary Tags" variant="primary">
            <Tag id="p1">Analytics</Tag>
            <Tag id="p2">Security</Tag>
            <Tag id="p3">Database</Tag>
          </TagGroup>

          <TagGroup label="Secondary Tags (Default)" variant="secondary">
            <Tag id="s1">Analytics</Tag>
            <Tag id="s2">Security</Tag>
            <Tag id="s3">Database</Tag>
          </TagGroup>

          <TagGroup label="Tertiary Tags" variant="tertiary">
            <Tag id="t1">Analytics</Tag>
            <Tag id="t2">Security</Tag>
            <Tag id="t3">Database</Tag>
          </TagGroup>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Sizes (Small, Medium, Large)</h3>
        <div className="flex flex-col gap-3">
          <TagGroup label="Small size" size="sm" variant="primary" onRemove={() => {}}>
            <Tag id="sm1">Small Tag</Tag>
            <Tag id="sm2">Tag 2</Tag>
          </TagGroup>

          <TagGroup label="Medium size" size="md" variant="secondary" onRemove={() => {}}>
            <Tag id="md1">Medium Tag</Tag>
            <Tag id="md2">Tag 2</Tag>
          </TagGroup>

          <TagGroup label="Large size" size="lg" variant="tertiary" onRemove={() => {}}>
            <Tag id="lg1">Large Tag</Tag>
            <Tag id="lg2">Tag 2</Tag>
          </TagGroup>
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-neutral-200 dark:border-neutral-800 pt-4">
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Interactive & Removable</h3>
        <TagGroup
          label="Tags with Action & Removal"
          selectionMode="multiple"
          selectedKeys={selected}
          onSelectionChange={setSelected}
          onRemove={handleRemove}
        >
          {tags.map((tag) => (
            <Tag key={tag.id} id={tag.id}>
              {tag.label}
            </Tag>
          ))}
        </TagGroup>
        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          Selected: <span className="text-primary-600 dark:text-primary-400 font-medium">{[...selected].join(', ') || 'None'}</span>
        </div>
      </div>
    </div>
  )
}

export function ComboBoxTagGroupDemo() {
  const provinces = [
    { id: 'phnom-penh', name: 'Phnom Penh' },
    { id: 'siem-reap', name: 'Siem Reap' },
    { id: 'battambang', name: 'Battambang' },
    { id: 'sihanoukville', name: 'Sihanoukville' },
    { id: 'kampot', name: 'Kampot' },
    { id: 'kandal', name: 'Kandal' },
    { id: 'kampong-cham', name: 'Kampong Cham' },
    { id: 'koh-kong', name: 'Koh Kong' },
    { id: 'kep', name: 'Kep' },
  ]

  const [selectedKeys, setSelectedKeys] = useState<Set<any>>(new Set())
  const [inputValue, setInputValue] = useState('')

  const availableProvinces = provinces.filter(
    (p) => !selectedKeys.has(p.id)
  )

  const handleSelectionChange = (key: any) => {
    if (key) {
      setSelectedKeys((prev) => {
        const next = new Set(prev)
        next.add(key)
        return next
      })
      setInputValue('')
    }
  }

  const handleRemove = (keys: Set<any>) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      for (const k of keys) {
        next.delete(k)
      }
      return next
    })
  }

  return (
    <div className="w-full max-w-sm flex flex-col gap-4">
      <ComboBox
        label="Cambodian Provinces"
        placeholder="Select a province"
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSelectionChange={handleSelectionChange}
        selectedKey={null}
      >
        {availableProvinces.map((province) => (
          <ComboBoxItem key={province.id} id={province.id}>
            {province.name}
          </ComboBoxItem>
        ))}
      </ComboBox>

      {selectedKeys.size > 0 && (
        <TagGroup
          label="Selected Provinces"
          onRemove={handleRemove}
          variant="primary"
        >
          {[...selectedKeys].map((key) => {
            const province = provinces.find((p) => p.id === key)
            return (
              <Tag key={key} id={key}>
                {province?.name || key}
              </Tag>
            )
          })}
        </TagGroup>
      )}
    </div>
  )
}
