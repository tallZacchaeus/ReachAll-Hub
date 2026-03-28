export type ClassValue = string | number | boolean | undefined | null | ClassValue[] | Record<string, boolean>;

function clsx(...inputs: ClassValue[]): string {
  const classes: string[] = [];
  
  for (const input of inputs) {
    if (!input) continue;
    
    if (typeof input === 'string' || typeof input === 'number') {
      classes.push(String(input));
    } else if (Array.isArray(input)) {
      const result = clsx(...input);
      if (result) classes.push(result);
    } else if (typeof input === 'object') {
      for (const key in input) {
        if (input[key]) classes.push(key);
      }
    }
  }
  
  return classes.join(' ');
}

// Simple tailwind class merger - deduplicates classes and keeps the last occurrence
function twMerge(classNames: string): string {
  if (!classNames) return '';
  
  const classes = classNames.split(' ').filter(Boolean);
  const classMap = new Map<string, string>();
  
  // Group classes by their prefix (e.g., 'text-', 'bg-', 'p-', etc.)
  classes.forEach(cls => {
    // Extract the prefix from the class
    const match = cls.match(/^([\w-]+?)-/);
    const prefix = match ? match[1] : cls;
    
    // For conflicting utility classes, keep the last one
    const conflictingPrefixes = [
      'text', 'bg', 'border', 'p', 'px', 'py', 'pt', 'pb', 'pl', 'pr',
      'm', 'mx', 'my', 'mt', 'mb', 'ml', 'mr', 'w', 'h', 'min-w', 'min-h',
      'max-w', 'max-h', 'gap', 'space-x', 'space-y', 'rounded', 'shadow',
      'opacity', 'z', 'top', 'bottom', 'left', 'right', 'flex', 'grid',
      'items', 'justify', 'content', 'self', 'font', 'leading', 'tracking'
    ];
    
    if (conflictingPrefixes.includes(prefix)) {
      classMap.set(prefix, cls);
    } else {
      // For non-conflicting classes, use the full class name as key
      classMap.set(cls, cls);
    }
  });
  
  return Array.from(classMap.values()).join(' ');
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}
