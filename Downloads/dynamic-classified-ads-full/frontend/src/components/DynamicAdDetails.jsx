import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Heading, Text, Grid, GridItem, Badge, Flex, Divider } from '@chakra-ui/react';

// Component for displaying dynamic fields in ad details
const DynamicAdDetails = ({ 
  ad,
  language = 'ar' 
}) => {
  const { t } = useTranslation();
  const [categoryFields, setCategoryFields] = useState([]);

  useEffect(() => {
    // Ad object should contain categoryFields from the backend
    if (ad && ad.categoryFields) {
      // Filter fields that should be shown in ad view
      const visibleFields = ad.categoryFields.filter(field => field.showInAdView);
      // Sort fields by order
      const sortedFields = visibleFields.sort((a, b) => a.order - b.order);
      setCategoryFields(sortedFields);
    }
  }, [ad]);

  if (!ad || !ad.attributes || Object.keys(ad.attributes).length === 0 || !categoryFields.length) {
    return null;
  }

  // Helper function to get field label in current language
  const getFieldLabel = (field) => {
    return field.labelI18n[language] || field.name;
  };

  // Helper function to get option label in current language
  const getOptionLabel = (field, value) => {
    if (!field.options) return value;
    
    const option = field.options.find(opt => opt.value === value);
    return option ? (option.labelI18n[language] || option.value) : value;
  };

  // Render field value based on its type
  const renderFieldValue = (field, value) => {
    if (value === undefined || value === null) return '-';

    switch (field.fieldType) {
      case 'TEXT':
        return <Text>{value}</Text>;

      case 'NUMBER':
        return <Text>{value}</Text>;

      case 'SELECT':
        return <Text>{getOptionLabel(field, value)}</Text>;

      case 'MULTISELECT':
        if (!Array.isArray(value) || value.length === 0) return '-';
        return (
          <Flex flexWrap="wrap" gap={2}>
            {value.map((val, index) => (
              <Badge key={index} colorScheme="blue" variant="subtle">
                {getOptionLabel(field, val)}
              </Badge>
            ))}
          </Flex>
        );

      case 'BOOLEAN':
        return <Text>{value ? t('yes') : t('no')}</Text>;

      case 'DATE':
        return <Text>{new Date(value).toLocaleDateString(language === 'ar' ? 'ar-SA' : language === 'sv' ? 'sv-SE' : 'en-US')}</Text>;

      case 'RANGE':
        if (!value.min && !value.max) return '-';
        return (
          <Text>
            {value.min !== undefined ? value.min : '-'} - {value.max !== undefined ? value.max : '-'}
          </Text>
        );

      default:
        return <Text>{String(value)}</Text>;
    }
  };

  return (
    <Box mt={6}>
      <Heading as="h3" size="md" mb={4}>
        {t('adDetails.specifications')}
      </Heading>
      <Divider mb={4} />
      
      <Grid templateColumns={{ base: "repeat(1, 1fr)", md: "repeat(2, 1fr)" }} gap={4}>
        {categoryFields.map(field => {
          const value = ad.attributes[field.name];
          if (value === undefined || value === null) return null;
          
          return (
            <GridItem key={field.id}>
              <Flex>
                <Text fontWeight="bold" minWidth="120px">{getFieldLabel(field)}:</Text>
                <Box flex="1">{renderFieldValue(field, value)}</Box>
              </Flex>
            </GridItem>
          );
        })}
      </Grid>
    </Box>
  );
};

export default DynamicAdDetails;
