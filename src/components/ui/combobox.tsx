import { Check, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type Combo = {
  value: string;
  label: string;
  iata: string;
};

interface ComboBoxProps {
  combos: Combo[];
  onValueChange: (iata: string) => void;
}

const ComboBox: React.FC<ComboBoxProps> = ({ combos, onValueChange }) => {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState('');

  const handleSelect = (currentValue: string, currentIata: string) => {
    const newValue = currentValue === value ? '' : currentValue;
    setValue(newValue);
    onValueChange(currentIata);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-f justify-between"
        >
          {value
            ? combos.find((combo) => combo.value === value)?.label
            : `Select an airport`}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder={`Search for an airport`} />
          <CommandList>
            <CommandEmpty>No airport found.</CommandEmpty>
            <CommandGroup>
              {combos.map((combo) => (
                <CommandItem
                  key={combo.value}
                  value={combo.value}
                  onSelect={() => handleSelect(combo.value, combo.iata)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === combo.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {combo.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export { ComboBox };
