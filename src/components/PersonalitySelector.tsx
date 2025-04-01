import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { PersonalityMode } from '@/types';

interface PersonalitySelectorProps {
  value: PersonalityMode;
  onChange: (newPersonality: PersonalityMode) => void;
}

const personalities: PersonalityMode[] = [
  {
    name: 'casual',
    description: 'Friendly and conversational',
    systemPrompt: 'You are a helpful and friendly AI assistant.'
  },
  {
    name: 'professional',
    description: 'Formal and business-like',
    systemPrompt: 'You are a professional AI assistant focused on business and technical topics.'
  },
  {
    name: 'creative',
    description: 'Imaginative and artistic',
    systemPrompt: 'You are a creative AI assistant that helps with artistic and imaginative tasks.'
  }
];

export default function PersonalitySelector({ value, onChange }: PersonalitySelectorProps) {
  const handleChange = (event: SelectChangeEvent) => {
    const selectedPersonality = personalities.find(p => p.name === event.target.value);
    if (selectedPersonality) {
      onChange(selectedPersonality);
    }
  };

  return (
    <FormControl fullWidth sx={{ mt: 2 }}>
      <InputLabel>Personality</InputLabel>
      <Select
        value={value.name}
        label="Personality"
        onChange={handleChange}
      >
        {personalities.map((personality) => (
          <MenuItem key={personality.name} value={personality.name}>
            {personality.description}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
} 