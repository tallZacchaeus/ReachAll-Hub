import { motion } from "motion/react";

interface TypingIndicatorProps {
    users: string[];
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
    if (users.length === 0) return null;

    const displayText =
        users.length === 1
            ? `${users[0]} is typing...`
            : users.length === 2
                ? `${users[0]} and ${users[1]} are typing...`
                : `${users[0]} and ${users.length - 1} others are typing...`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-6 py-2 text-sm text-muted-foreground italic"
        >
            {displayText}
            <span className="inline-flex ml-1">
                <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                >
                    .
                </motion.span>
                <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                >
                    .
                </motion.span>
                <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                >
                    .
                </motion.span>
            </span>
        </motion.div>
    );
}
