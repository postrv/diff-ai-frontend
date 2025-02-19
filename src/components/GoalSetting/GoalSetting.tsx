// File: src/components/GoalSetting/GoalSetting.tsx
import React, { useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    RadioGroup,
    FormControlLabel,
    Radio,
    TextField,
    Box,
    Paper,
    Chip,
    Divider,
    Button,
    Alert,
    Grid,
    Stepper,
    Step,
    StepLabel,
    StepContent
} from '@mui/material';

interface MergeGoal {
    strategy: 'latest' | 'original' | 'both' | 'custom';
    customRules?: string[];
    priorities?: ('accuracy' | 'completeness' | 'conciseness')[];
    preserveSections?: string[];
    notes?: string;
}

interface GoalSettingProps {
    onGoalSet: (goal: MergeGoal) => void;
    initialGoal?: MergeGoal;
}

const defaultGoal: MergeGoal = {
    strategy: 'latest',
    priorities: ['accuracy'],
    customRules: [],
};

const GoalSetting: React.FC<GoalSettingProps> = ({ onGoalSet, initialGoal }) => {
    const [goal, setGoal] = useState<MergeGoal>(initialGoal || defaultGoal);
    const [customRule, setCustomRule] = useState('');
    const [sectionToPreserve, setSectionToPreserve] = useState('');
    const [activeStep, setActiveStep] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const handleStrategyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setGoal({
            ...goal,
            strategy: event.target.value as MergeGoal['strategy']
        });
    };

    const handlePriorityToggle = (priority: 'accuracy' | 'completeness' | 'conciseness') => {
        const currentPriorities = goal.priorities || [];
        const newPriorities = currentPriorities.includes(priority)
            ? currentPriorities.filter(p => p !== priority)
            : [...currentPriorities, priority];

        setGoal({
            ...goal,
            priorities: newPriorities
        });
    };

    const handleAddCustomRule = () => {
        if (!customRule.trim()) return;

        setGoal({
            ...goal,
            customRules: [...(goal.customRules || []), customRule.trim()]
        });
        setCustomRule('');
    };

    const handleRemoveCustomRule = (index: number) => {
        const newRules = [...(goal.customRules || [])];
        newRules.splice(index, 1);
        setGoal({
            ...goal,
            customRules: newRules
        });
    };

    const handleAddSectionToPreserve = () => {
        if (!sectionToPreserve.trim()) return;

        setGoal({
            ...goal,
            preserveSections: [...(goal.preserveSections || []), sectionToPreserve.trim()]
        });
        setSectionToPreserve('');
    };

    const handleRemoveSectionToPreserve = (index: number) => {
        const newSections = [...(goal.preserveSections || [])];
        newSections.splice(index, 1);
        setGoal({
            ...goal,
            preserveSections: newSections
        });
    };

    const handleNotesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setGoal({
            ...goal,
            notes: event.target.value
        });
    };

    const handleNext = () => {
        setActiveStep((prevStep) => prevStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    const handleSubmit = () => {
        if (goal.strategy === 'custom' && (!goal.customRules || goal.customRules.length === 0)) {
            setError('Please add at least one custom rule when using the custom strategy');
            return;
        }

        if (!goal.priorities || goal.priorities.length === 0) {
            setError('Please select at least one priority');
            return;
        }

        setError(null);
        onGoalSet(goal);
    };

    const steps = [
        {
            label: 'Select Merge Strategy',
            content: (
                <Box sx={{ mt: 2 }}>
                    <RadioGroup
                        value={goal.strategy}
                        onChange={handleStrategyChange}
                    >
                        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                            <FormControlLabel
                                value="latest"
                                control={<Radio />}
                                label={
                                    <Box>
                                        <Typography variant="subtitle1">Use Latest Version</Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Prefer changes from the newer document in all cases
                                        </Typography>
                                    </Box>
                                }
                            />
                        </Paper>

                        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                            <FormControlLabel
                                value="original"
                                control={<Radio />}
                                label={
                                    <Box>
                                        <Typography variant="subtitle1">Preserve Original</Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Keep the original document, ignoring changes
                                        </Typography>
                                    </Box>
                                }
                            />
                        </Paper>

                        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                            <FormControlLabel
                                value="both"
                                control={<Radio />}
                                label={
                                    <Box>
                                        <Typography variant="subtitle1">Keep Both Versions</Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Preserve both versions where conflicts exist
                                        </Typography>
                                    </Box>
                                }
                            />
                        </Paper>

                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <FormControlLabel
                                value="custom"
                                control={<Radio />}
                                label={
                                    <Box>
                                        <Typography variant="subtitle1">Custom Rules</Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Define specific rules for merging
                                        </Typography>
                                    </Box>
                                }
                            />
                        </Paper>
                    </RadioGroup>
                </Box>
            )
        },
        {
            label: 'Set Priorities',
            content: (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="body1" gutterBottom>
                        Select merge priorities (you can choose multiple):
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                        <Chip
                            label="Accuracy"
                            color={goal.priorities?.includes('accuracy') ? 'primary' : 'default'}
                            onClick={() => handlePriorityToggle('accuracy')}
                            sx={{ px: 1 }}
                        />
                        <Chip
                            label="Completeness"
                            color={goal.priorities?.includes('completeness') ? 'primary' : 'default'}
                            onClick={() => handlePriorityToggle('completeness')}
                            sx={{ px: 1 }}
                        />
                        <Chip
                            label="Conciseness"
                            color={goal.priorities?.includes('conciseness') ? 'primary' : 'default'}
                            onClick={() => handlePriorityToggle('conciseness')}
                            sx={{ px: 1 }}
                        />
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="body1" gutterBottom>
                        Define sections to preserve (optional):
                    </Typography>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={9}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                size="small"
                                placeholder="E.g., 'Section 2.1', 'Introduction', etc."
                                value={sectionToPreserve}
                                onChange={(e) => setSectionToPreserve(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleAddSectionToPreserve();
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={3}>
                            <Button
                                variant="outlined"
                                onClick={handleAddSectionToPreserve}
                                fullWidth
                            >
                                Add
                            </Button>
                        </Grid>
                    </Grid>

                    {goal.preserveSections && goal.preserveSections.length > 0 && (
                        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Sections to preserve:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {goal.preserveSections.map((section, index) => (
                                    <Chip
                                        key={index}
                                        label={section}
                                        onDelete={() => handleRemoveSectionToPreserve(index)}
                                    />
                                ))}
                            </Box>
                        </Paper>
                    )}
                </Box>
            )
        },
        {
            label: 'Custom Rules',
            content: (
                <Box sx={{ mt: 2 }}>
                    {goal.strategy === 'custom' ? (
                        <>
                            <Typography variant="body1" gutterBottom>
                                Define custom rules for merging:
                            </Typography>

                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={9}>
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        size="small"
                                        placeholder="E.g., 'Keep all formatting from original'"
                                        value={customRule}
                                        onChange={(e) => setCustomRule(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                handleAddCustomRule();
                                            }
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={3}>
                                    <Button
                                        variant="outlined"
                                        onClick={handleAddCustomRule}
                                        fullWidth
                                    >
                                        Add Rule
                                    </Button>
                                </Grid>
                            </Grid>

                            {goal.customRules && goal.customRules.length > 0 ? (
                                <Paper variant="outlined" sx={{ p: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Custom rules:
                                    </Typography>
                                    <Box component="ol" sx={{ pl: 2 }}>
                                        {goal.customRules.map((rule, index) => (
                                            <Box component="li" key={index} sx={{ mb: 1 }}>
                                                <Grid container alignItems="center" spacing={1}>
                                                    <Grid item xs>
                                                        <Typography variant="body2">{rule}</Typography>
                                                    </Grid>
                                                    <Grid item>
                                                        <Button
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleRemoveCustomRule(index)}
                                                        >
                                                            Remove
                                                        </Button>
                                                    </Grid>
                                                </Grid>
                                            </Box>
                                        ))}
                                    </Box>
                                </Paper>
                            ) : (
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    Add custom rules to guide the merge process. For example: "Prefer newer dates", "Keep formatting from the original", etc.
                                </Alert>
                            )}
                        </>
                    ) : (
                        <Alert severity="info">
                            Custom rules are only available when the "Custom Rules" strategy is selected.
                            Go back to the first step if you want to use custom rules.
                        </Alert>
                    )}
                </Box>
            )
        },
        {
            label: 'Additional Notes',
            content: (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="body1" gutterBottom>
                        Add any additional notes or instructions for the merge process:
                    </Typography>

                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                        placeholder="Add any specific requirements or notes that might help with the merge process..."
                        value={goal.notes || ''}
                        onChange={handleNotesChange}
                    />

                    <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                        These notes will be considered during the AI-assisted merge process to better meet your requirements.
                    </Typography>
                </Box>
            )
        }
    ];

    return (
        <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                    Merge Goal Setting
                </Typography>

                <Typography variant="body1" sx={{ mb: 3 }}>
                    Define how you want the documents to be merged. These settings will guide the AI-assisted merge process.
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Stepper activeStep={activeStep} orientation="vertical">
                    {steps.map((step, index) => (
                        <Step key={index}>
                            <StepLabel>{step.label}</StepLabel>
                            <StepContent>
                                {step.content}
                                <Box sx={{ mt: 3, mb: 2 }}>
                                    <Button
                                        disabled={activeStep === 0}
                                        onClick={handleBack}
                                        sx={{ mr: 1 }}
                                    >
                                        Back
                                    </Button>

                                    {activeStep === steps.length - 1 ? (
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={handleSubmit}
                                        >
                                            Finish
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="contained"
                                            onClick={handleNext}
                                        >
                                            Continue
                                        </Button>
                                    )}
                                </Box>
                            </StepContent>
                        </Step>
                    ))}
                </Stepper>

                {activeStep === steps.length && (
                    <Paper square elevation={0} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            All steps completed
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            Your merge goals have been set. Click "Apply Goals" to continue with the merge process.
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSubmit}
                            sx={{ mt: 1, mr: 1 }}
                        >
                            Apply Goals
                        </Button>
                        <Button
                            onClick={() => setActiveStep(0)}
                            sx={{ mt: 1 }}
                        >
                            Reset
                        </Button>
                    </Paper>
                )}
            </CardContent>
        </Card>
    );
};

export default GoalSetting;