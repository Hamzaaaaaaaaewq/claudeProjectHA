import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Heading, FormControl, FormLabel, Input, Select, Button, 
         Table, Thead, Tbody, Tr, Th, Td, IconButton, Flex, 
         Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, 
         ModalCloseButton, ModalFooter, useDisclosure, 
         Tabs, TabList, Tab, TabPanels, TabPanel, 
         Badge, useToast } from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, ArrowUpIcon, ArrowDownIcon } from '@chakra-ui/icons';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Component for managing category fields in admin panel
const CategoryFieldsAdmin = ({ categoryId }) => {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentField, setCurrentField] = useState(null);
  const [currentOptions, setCurrentOptions] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [fieldTypes] = useState([
    { value: 'TEXT', label: t('admin.fieldTypes.text') },
    { value: 'NUMBER', label: t('admin.fieldTypes.number') },
    { value: 'SELECT', label: t('admin.fieldTypes.select') },
    { value: 'MULTISELECT', label: t('admin.fieldTypes.multiselect') },
    { value: 'BOOLEAN', label: t('admin.fieldTypes.boolean') },
    { value: 'DATE', label: t('admin.fieldTypes.date') },
    { value: 'RANGE', label: t('admin.fieldTypes.range') }
  ]);
  
  const currentLanguage = i18n.language || 'ar';
  const supportedLanguages = ['ar', 'en', 'sv'];

  // Fetch category fields
  const fetchFields = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/category-fields?categoryId=${categoryId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch category fields');
      }
      const data = await response.json();
      // Sort fields by order
      const sortedFields = data.sort((a, b) => a.order - b.order);
      setFields(sortedFields);
      setError(null);
    } catch (err) {
      console.error('Error fetching category fields:', err);
      setError(err.message);
      toast({
        title: t('admin.error'),
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (categoryId) {
      fetchFields();
    }
  }, [categoryId]);

  // Handle field form submission
  const handleFieldSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let response;
      const fieldData = {
        ...currentField,
        categoryId,
      };
      
      if (isEditing) {
        // Update existing field with options
        response = await fetch(`/api/admin/category-fields/${currentField.id}/with-options`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            field: fieldData,
            options: currentOptions,
            deleteOptions: [], // Add IDs of options to delete if needed
          }),
        });
      } else {
        // Create new field with options
        response = await fetch('/api/admin/category-fields/with-options', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            field: fieldData,
            options: currentOptions,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save field');
      }

      // Refresh fields list
      fetchFields();
      
      // Close modal and reset form
      onClose();
      setCurrentField(null);
      setCurrentOptions([]);
      setIsEditing(false);
      
      toast({
        title: isEditing ? t('admin.fieldUpdated') : t('admin.fieldCreated'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error saving field:', err);
      toast({
        title: t('admin.error'),
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle field deletion
  const handleDeleteField = async (fieldId) => {
    if (!confirm(t('admin.confirmDeleteField'))) return;
    
    try {
      const response = await fetch(`/api/admin/category-fields/${fieldId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete field');
      }

      // Refresh fields list
      fetchFields();
      
      toast({
        title: t('admin.fieldDeleted'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error deleting field:', err);
      toast({
        title: t('admin.error'),
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle field reordering
  const handleReorderFields = async (result) => {
    if (!result.destination) return;
    
    const items = Array.from(fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update local state immediately for better UX
    setFields(items);
    
    // Send reorder request to backend
    try {
      const fieldIds = items.map(field => field.id);
      const response = await fetch(`/api/admin/category-fields/${categoryId}/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fieldIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reorder fields');
      }
      
      toast({
        title: t('admin.fieldsReordered'),
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error reordering fields:', err);
      // Revert to original order on error
      fetchFields();
      toast({
        title: t('admin.error'),
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle option reordering
  const handleReorderOptions = async (result) => {
    if (!result.destination) return;
    
    const items = Array.from(currentOptions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update options order
    const updatedOptions = items.map((option, index) => ({
      ...option,
      order: index,
    }));
    
    setCurrentOptions(updatedOptions);
  };

  // Open modal to add new field
  const handleAddField = () => {
    setCurrentField({
      name: '',
      labelI18n: { ar: '', en: '', sv: '' },
      fieldType: 'TEXT',
      isRequired: false,
      order: fields.length,
      showInFilters: true,
      showInAdView: true,
      validationRules: {},
    });
    setCurrentOptions([]);
    setIsEditing(false);
    setActiveTab(0);
    onOpen();
  };

  // Open modal to edit field
  const handleEditField = (field) => {
    setCurrentField({
      ...field,
    });
    setCurrentOptions(field.options || []);
    setIsEditing(true);
    setActiveTab(0);
    onOpen();
  };

  // Add new option to current field
  const handleAddOption = () => {
    const newOption = {
      value: `option_${currentOptions.length + 1}`,
      labelI18n: { ar: '', en: '', sv: '' },
      order: currentOptions.length,
    };
    setCurrentOptions([...currentOptions, newOption]);
  };

  // Remove option from current field
  const handleRemoveOption = (index) => {
    const updatedOptions = [...currentOptions];
    updatedOptions.splice(index, 1);
    setCurrentOptions(updatedOptions);
  };

  // Update option value
  const handleOptionChange = (index, field, value) => {
    const updatedOptions = [...currentOptions];
    if (field.startsWith('labelI18n.')) {
      const lang = field.split('.')[1];
      updatedOptions[index].labelI18n = {
        ...updatedOptions[index].labelI18n,
        [lang]: value,
      };
    } else {
      updatedOptions[index][field] = value;
    }
    setCurrentOptions(updatedOptions);
  };

  // Update field value
  const handleFieldChange = (field, value) => {
    if (field.startsWith('labelI18n.')) {
      const lang = field.split('.')[1];
      setCurrentField({
        ...currentField,
        labelI18n: {
          ...currentField.labelI18n,
          [lang]: value,
        },
      });
    } else if (field === 'fieldType') {
      // Reset options if changing from/to SELECT/MULTISELECT
      const wasSelectType = currentField.fieldType === 'SELECT' || currentField.fieldType === 'MULTISELECT';
      const isSelectType = value === 'SELECT' || value === 'MULTISELECT';
      
      if (!wasSelectType && isSelectType) {
        // Add default option when changing to SELECT/MULTISELECT
        setCurrentOptions([{
          value: 'option_1',
          labelI18n: { ar: '', en: '', sv: '' },
          order: 0,
        }]);
      } else if (wasSelectType && !isSelectType) {
        // Clear options when changing from SELECT/MULTISELECT
        setCurrentOptions([]);
      }
      
      setCurrentField({
        ...currentField,
        fieldType: value,
      });
    } else if (field === 'isRequired' || field === 'showInFilters' || field === 'showInAdView') {
      setCurrentField({
        ...currentField,
        [field]: value === 'true',
      });
    } else {
      setCurrentField({
        ...currentField,
        [field]: value,
      });
    }
  };

  return (
    <Box>
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Heading size="md">{t('admin.categoryFields')}</Heading>
        <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleAddField}>
          {t('admin.addField')}
        </Button>
      </Flex>

      {loading ? (
        <Box>{t('loading')}</Box>
      ) : error ? (
        <Box color="red.500">{error}</Box>
      ) : (
        <DragDropContext onDragEnd={handleReorderFields}>
          <Droppable droppableId="fields">
            {(provided) => (
              <Table variant="simple" {...provided.droppableProps} ref={provided.innerRef}>
                <Thead>
                  <Tr>
                    <Th width="40px"></Th>
                    <Th>{t('admin.fieldName')}</Th>
                    <Th>{t('admin.fieldLabel')}</Th>
                    <Th>{t('admin.fieldType')}</Th>
                    <Th>{t('admin.required')}</Th>
                    <Th>{t('admin.showInFilters')}</Th>
                    <Th>{t('admin.actions')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {fields.map((field, index) => (
                    <Draggable key={field.id} draggableId={field.id} index={index}>
                      {(provided) => (
                        <Tr
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <Td>{index + 1}</Td>
                          <Td>{field.name}</Td>
                          <Td>{field.labelI18n[currentLanguage] || field.name}</Td>
                          <Td>
                            <Badge colorScheme={
                              field.fieldType === 'SELECT' || field.fieldType === 'MULTISELECT' 
                                ? 'green' 
                                : field.fieldType === 'BOOLEAN' 
                                  ? 'purple' 
                                  : 'blue'
                            }>
                              {field.fieldType}
                            </Badge>
                          </Td>
                          <Td>{field.isRequired ? t('yes') : t('no')}</Td>
                          <Td>{field.showInFilters ? t('yes') : t('no')}</Td>
                          <Td>
                            <IconButton
                              icon={<EditIcon />}
                              size="sm"
                              mr={2}
                              aria-label={t('admin.edit')}
                              onClick={() => handleEditField(field)}
                            />
                            <IconButton
                              icon={<DeleteIcon />}
                              size="sm"
                              colorScheme="red"
                              aria-label={t('admin.delete')}
                              onClick={() => handleDeleteField(field.id)}
                            />
                          </Td>
                        </Tr>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Tbody>
              </Table>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Field Edit/Add Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {isEditing ? t('admin.editField') : t('admin.addField')}
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleFieldSubmit}>
            <ModalBody>
              <Tabs index={activeTab} onChange={setActiveTab}>
                <TabList>
                  <Tab>{t('admin.basicInfo')}</Tab>
                  <Tab>{t('admin.translations')}</Tab>
                  {(currentField?.fieldType === 'SELECT' || currentField?.fieldType === 'MULTISELECT') && (
                    <Tab>{t('admin.options')}</Tab>
                  )}
                  <Tab>{t('admin.validation')}</Tab>
                </TabList>

                <TabPanels>
                  {/* Basic Info Tab */}
                  <TabPanel>
                    <FormControl mb={4} isRequired>
                      <FormLabel>{t('admin.fieldName')}</FormLabel>
                      <Input
                        value={currentField?.name || ''}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        placeholder={t('admin.fieldNamePlaceholder')}
                      />
                    </FormControl>

                    <FormControl mb={4} isRequired>
                      <FormLabel>{t('admin.fieldLabel')}</FormLabel>
                      <Input
                        value={currentField?.labelI18n?.[currentLanguage] || ''}
                        onChange={(e) => handleFieldChange(`labelI18n.${currentLanguage}`, e.target.value)}
                        placeholder={t('admin.fieldLabelPlaceholder')}
                      />
                    </FormControl>

                    <FormControl mb={4} isRequired>
                      <FormLabel>{t('admin.fieldType')}</FormLabel>
                      <Select
                        value={currentField?.fieldType || 'TEXT'}
                        onChange={(e) => handleFieldChange('fieldType', e.target.value)}
                      >
                        {fieldTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl mb={4}>
                      <FormLabel>{t('admin.required')}</FormLabel>
                      <Select
                        value={currentField?.isRequired ? 'true' : 'false'}
                        onChange={(e) => handleFieldChange('isRequired', e.target.value)}
                      >
                        <option value="true">{t('yes')}</option>
                        <option value="false">{t('no')}</option>
                      </Select>
                    </FormControl>

                    <FormControl mb={4}>
                      <FormLabel>{t('admin.showInFilters')}</FormLabel>
                      <Select
                        value={currentField?.showInFilters ? 'true' : 'false'}
                        onChange={(e) => handleFieldChange('showInFilters', e.target.value)}
                      >
                        <option value="true">{t('yes')}</option>
                        <option value="false">{t('no')}</option>
                      </Select>
                    </FormControl>

                    <FormControl mb={4}>
                      <FormLabel>{t('admin.showInAdView')}</FormLabel>
                      <Select
                        value={currentField?.showInAdView ? 'true' : 'false'}
                        onChange={(e) => handleFieldChange('showInAdView', e.target.value)}
                      >
                        <option value="true">{t('yes')}</option>
                        <option value="false">{t('no')}</option>
                      </Select>
                    </FormControl>
                  </TabPanel>

                  {/* Translations Tab */}
                  <TabPanel>
                    {supportedLanguages.map((lang) => (
                      <FormControl key={lang} mb={4}>
                        <FormLabel>{t(`languages.${lang}`)}</FormLabel>
                        <Input
                          value={currentField?.labelI18n?.[lang] || ''}
                          onChange={(e) => handleFieldChange(`labelI18n.${lang}`, e.target.value)}
                          placeholder={t('admin.translationPlaceholder', { language: t(`languages.${lang}`) })}
                        />
                      </FormControl>
                    ))}
                  </TabPanel>

                  {/* Options Tab (for SELECT and MULTISELECT) */}
                  {(currentField?.fieldType === 'SELECT' || currentField?.fieldType === 'MULTISELECT') && (
                    <TabPanel>
                      <Box mb={4}>
                        <Button colorScheme="blue" size="sm" onClick={handleAddOption}>
                          {t('admin.addOption')}
                        </Button>
                      </Box>

                      <DragDropContext onDragEnd={handleReorderOptions}>
                        <Droppable droppableId="options">
                          {(provided) => (
                            <Box {...provided.droppableProps} ref={provided.innerRef}>
                              {currentOptions.map((option, index) => (
                                <Draggable key={index} draggableId={`option-${index}`} index={index}>
                                  {(provided) => (
                                    <Box
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      mb={4}
                                      p={3}
                                      borderWidth="1px"
                                      borderRadius="md"
                                    >
                                      <Flex justifyContent="space-between" mb={2}>
                                        <Heading size="xs">{t('admin.option')} #{index + 1}</Heading>
                                        <IconButton
                                          icon={<DeleteIcon />}
                                          size="xs"
                                          colorScheme="red"
                                          aria-label={t('admin.removeOption')}
                                          onClick={() => handleRemoveOption(index)}
                                        />
                                      </Flex>

                                      <FormControl mb={2}>
                                        <FormLabel>{t('admin.optionValue')}</FormLabel>
                                        <Input
                                          value={option.value}
                                          onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                                          placeholder={t('admin.optionValuePlaceholder')}
                                        />
                                      </FormControl>

                                      <Tabs variant="soft-rounded" size="sm">
                                        <TabList>
                                          {supportedLanguages.map((lang) => (
                                            <Tab key={lang}>{t(`languages.${lang}`)}</Tab>
                                          ))}
                                        </TabList>
                                        <TabPanels>
                                          {supportedLanguages.map((lang) => (
                                            <TabPanel key={lang}>
                                              <FormControl>
                                                <FormLabel>{t('admin.optionLabel')}</FormLabel>
                                                <Input
                                                  value={option.labelI18n?.[lang] || ''}
                                                  onChange={(e) => handleOptionChange(index, `labelI18n.${lang}`, e.target.value)}
                                                  placeholder={t('admin.optionLabelPlaceholder', { language: t(`languages.${lang}`) })}
                                                />
                                              </FormControl>
                                            </TabPanel>
                                          ))}
                                        </TabPanels>
                                      </Tabs>
                                    </Box>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </Box>
                          )}
                        </Droppable>
                      </DragDropContext>

                      {currentOptions.length === 0 && (
                        <Box textAlign="center" py={4}>
                          {t('admin.noOptions')}
                        </Box>
                      )}
                    </TabPanel>
                  )}

                  {/* Validation Tab */}
                  <TabPanel>
                    {currentField?.fieldType === 'TEXT' && (
                      <>
                        <FormControl mb={4}>
                          <FormLabel>{t('admin.validation.minLength')}</FormLabel>
                          <Input
                            type="number"
                            value={currentField?.validationRules?.minLength || ''}
                            onChange={(e) => {
                              const value = e.target.value ? parseInt(e.target.value) : '';
                              setCurrentField({
                                ...currentField,
                                validationRules: {
                                  ...currentField.validationRules,
                                  minLength: value,
                                },
                              });
                            }}
                          />
                        </FormControl>

                        <FormControl mb={4}>
                          <FormLabel>{t('admin.validation.maxLength')}</FormLabel>
                          <Input
                            type="number"
                            value={currentField?.validationRules?.maxLength || ''}
                            onChange={(e) => {
                              const value = e.target.value ? parseInt(e.target.value) : '';
                              setCurrentField({
                                ...currentField,
                                validationRules: {
                                  ...currentField.validationRules,
                                  maxLength: value,
                                },
                              });
                            }}
                          />
                        </FormControl>

                        <FormControl mb={4}>
                          <FormLabel>{t('admin.validation.pattern')}</FormLabel>
                          <Input
                            value={currentField?.validationRules?.pattern || ''}
                            onChange={(e) => {
                              setCurrentField({
                                ...currentField,
                                validationRules: {
                                  ...currentField.validationRules,
                                  pattern: e.target.value,
                                },
                              });
                            }}
                            placeholder={t('admin.validation.patternPlaceholder')}
                          />
                        </FormControl>
                      </>
                    )}

                    {currentField?.fieldType === 'NUMBER' && (
                      <>
                        <FormControl mb={4}>
                          <FormLabel>{t('admin.validation.min')}</FormLabel>
                          <Input
                            type="number"
                            value={currentField?.validationRules?.min || ''}
                            onChange={(e) => {
                              const value = e.target.value ? parseFloat(e.target.value) : '';
                              setCurrentField({
                                ...currentField,
                                validationRules: {
                                  ...currentField.validationRules,
                                  min: value,
                                },
                              });
                            }}
                          />
                        </FormControl>

                        <FormControl mb={4}>
                          <FormLabel>{t('admin.validation.max')}</FormLabel>
                          <Input
                            type="number"
                            value={currentField?.validationRules?.max || ''}
                            onChange={(e) => {
                              const value = e.target.value ? parseFloat(e.target.value) : '';
                              setCurrentField({
                                ...currentField,
                                validationRules: {
                                  ...currentField.validationRules,
                                  max: value,
                                },
                              });
                            }}
                          />
                        </FormControl>
                      </>
                    )}

                    {currentField?.fieldType === 'RANGE' && (
                      <>
                        <FormControl mb={4}>
                          <FormLabel>{t('admin.validation.min')}</FormLabel>
                          <Input
                            type="number"
                            value={currentField?.validationRules?.min || ''}
                            onChange={(e) => {
                              const value = e.target.value ? parseFloat(e.target.value) : '';
                              setCurrentField({
                                ...currentField,
                                validationRules: {
                                  ...currentField.validationRules,
                                  min: value,
                                },
                              });
                            }}
                          />
                        </FormControl>

                        <FormControl mb={4}>
                          <FormLabel>{t('admin.validation.max')}</FormLabel>
                          <Input
                            type="number"
                            value={currentField?.validationRules?.max || ''}
                            onChange={(e) => {
                              const value = e.target.value ? parseFloat(e.target.value) : '';
                              setCurrentField({
                                ...currentField,
                                validationRules: {
                                  ...currentField.validationRules,
                                  max: value,
                                },
                              });
                            }}
                          />
                        </FormControl>
                      </>
                    )}

                    {(currentField?.fieldType !== 'TEXT' && 
                      currentField?.fieldType !== 'NUMBER' && 
                      currentField?.fieldType !== 'RANGE') && (
                      <Box textAlign="center" py={4}>
                        {t('admin.validation.noValidationOptions')}
                      </Box>
                    )}
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                {t('cancel')}
              </Button>
              <Button colorScheme="blue" type="submit">
                {isEditing ? t('admin.saveChanges') : t('admin.createField')}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default CategoryFieldsAdmin;
