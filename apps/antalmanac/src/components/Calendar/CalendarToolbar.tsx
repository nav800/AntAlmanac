import { IconButton, ListSubheader, Menu, Paper, Tooltip, useMediaQuery } from '@material-ui/core';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import { Theme, withStyles } from '@material-ui/core/styles';
import { ClassNameMap, Styles } from '@material-ui/core/styles/withStyles';
import { Delete, MoreHoriz, Undo } from '@material-ui/icons';
import React, { useState } from 'react';

import ConditionalWrapper from '../ConditionalWrapper';
import CustomEventDialog from './Toolbar/CustomEventDialog/CustomEventDialog';
import EditSchedule from './Toolbar/EditSchedule/EditSchedule';
import ScheduleNameDialog from './Toolbar/EditSchedule/ScheduleNameDialog';
import ExportCalendar from './Toolbar/ExportCalendar';
import ScreenshotButton from './Toolbar/ScreenshotButton';
import analyticsEnum, { logAnalytics } from '$lib/analytics';
import { changeCurrentSchedule, clearSchedules, undoDelete } from '$actions/AppStoreActions';
import TermViewer from '$components/Calendar/TermViewer';
import FinalsButton from '$components/Calendar/Toolbar/FinalsButton';

const styles: Styles<Theme, object> = {
    toolbar: {
        display: 'flex',
        overflow: 'hidden',
        marginBottom: '4px',
        alignItems: 'center',
        height: '50px',

        '& button': {
            margin: '0 2px 0 2px',
        },
        '& #finalButton': {
            marginLeft: '12px',
        },
        padding: '2px',
    },
    inline: {
        display: 'inline',
    },
    spacer: {
        flexGrow: 1,
    },
    scheduleSelector: {
        marginLeft: '10px',
        maxWidth: '9rem',
    },
    termSelector: {
        flexGrow: 1,
        flexShrink: 1,
        minWidth: '50px',
        overflow: 'hidden',
        padding: '1.5rem',
    },
    rootScheduleSelector: {
        paddingLeft: '5px',
    },
};

interface CalendarPaneToolbarProps {
    classes: ClassNameMap;
    scheduleMap: Map<string, [number, string][]>;
    currentScheduleIndex: number;
    showFinalsSchedule: boolean;
    toggleDisplayFinalsSchedule: () => void;
    onTakeScreenshot: (html2CanvasScreenshot: () => void) => void; // the function in an ancestor component that wraps ScreenshotButton.handleClick to perform canvas transformations before and after downloading the screenshot.
}

const CalendarPaneToolbar = ({
    classes,
    scheduleMap,
    currentScheduleIndex,
    showFinalsSchedule,
    toggleDisplayFinalsSchedule,
    onTakeScreenshot,
}: CalendarPaneToolbarProps) => {
    const handleScheduleChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>) => {
        logAnalytics({
            category: analyticsEnum.calendar.title,
            action: analyticsEnum.calendar.actions.CHANGE_SCHEDULE,
        });
        changeCurrentSchedule(event.target.value as number);
    };

    const isNotWideEnough = useMediaQuery('(max-width:1800px)');

    const [anchorEl, setAnchorEl] = useState<HTMLElement>();
    const [openSchedules, setOpenSchedules] = useState<boolean>(false);

    const handleMenuClick: React.MouseEventHandler<HTMLElement> = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose: React.MouseEventHandler<HTMLElement> = () => {
        setAnchorEl(undefined);
    };

    const handleScheduleClick = () => {
        setOpenSchedules((prev) => !prev);
    };

    return (
        <Paper elevation={0} variant="outlined" square className={classes.toolbar}>
            <EditSchedule />

            <Select
                classes={{ root: classes.rootScheduleSelector }}
                className={classes.scheduleSelector}
                value={currentScheduleIndex.toString()}
                onChange={handleScheduleChange}
                open={openSchedules}
                onClick={handleScheduleClick}
            >
                {Array.from(scheduleMap.entries()).flatMap(([term, schedules]) => [
                    <ListSubheader key={term}>{term}</ListSubheader>,
                    ...schedules.map(([scheduleIndex, scheduleName]) => (
                        <MenuItem key={scheduleIndex} value={scheduleIndex.toString()}>
                            {scheduleName}
                        </MenuItem>
                    )),
                ])}

                <ScheduleNameDialog onOpen={() => setOpenSchedules(true)} onClose={() => setOpenSchedules(false)} />
            </Select>

            <div className={classes.termSelector}>
                <TermViewer />
            </div>

            <Tooltip title="Undo last action">
                <IconButton
                    onClick={() => {
                        logAnalytics({
                            category: analyticsEnum.calendar.title,
                            action: analyticsEnum.calendar.actions.UNDO,
                        });
                        undoDelete(null);
                    }}
                >
                    <Undo fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Clear schedule">
                <IconButton
                    onClick={() => {
                        if (window.confirm('Are you sure you want to clear this schedule?')) {
                            clearSchedules();
                            logAnalytics({
                                category: analyticsEnum.calendar.title,
                                action: analyticsEnum.calendar.actions.CLEAR_SCHEDULE,
                            });
                        }
                    }}
                >
                    <Delete fontSize="small" />
                </IconButton>
            </Tooltip>

            <ConditionalWrapper
                condition={isNotWideEnough}
                wrapper={(children) => (
                    <div>
                        <IconButton onClick={handleMenuClick}>
                            <MoreHoriz />
                        </IconButton>

                        <Menu anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleMenuClose}>
                            {children}
                        </Menu>
                    </div>
                )}
            >
                <>
                    {[
                        <ScreenshotButton onTakeScreenshot={onTakeScreenshot} key="screenshot" />,
                        <ExportCalendar key="export" />,
                        <CustomEventDialog key="custom" />,
                        <FinalsButton
                            key="finals"
                            showFinalsSchedule={showFinalsSchedule}
                            toggleDisplayFinalsSchedule={toggleDisplayFinalsSchedule}
                        />,
                    ].map((element, index) => (
                        <ConditionalWrapper
                            key={index}
                            condition={isNotWideEnough}
                            wrapper={(children) => <MenuItem onClick={handleMenuClose}>{children}</MenuItem>}
                        >
                            {element}
                        </ConditionalWrapper>
                    ))}
                </>
            </ConditionalWrapper>
        </Paper>
    );
};

export default withStyles(styles)(CalendarPaneToolbar);
