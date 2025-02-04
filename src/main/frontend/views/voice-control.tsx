import {useSignal} from '@vaadin/hilla-react-signals';
import {Grid} from '@vaadin/react-components/Grid.js';
import {GridColumn} from '@vaadin/react-components/GridColumn.js';
import {Button} from '@vaadin/react-components/Button.js';
import {FormLayout} from '@vaadin/react-components/FormLayout.js';
import {TextField} from '@vaadin/react-components/TextField.js';
import {TextArea} from '@vaadin/react-components/TextArea.js';
import {Select} from '@vaadin/react-components/Select.js';
import {useForm} from '@vaadin/hilla-react-form';
import {IssuesService} from 'Frontend/generated/endpoints';
import {useEffect, useMemo} from 'react';

import {VoiceControl, VoiceFunction} from '../components/VoiceControl';
import Issue from 'Frontend/generated/org/spring/framework/ai/vaadin/model/Issue';
import IssueModel from 'Frontend/generated/org/spring/framework/ai/vaadin/model/IssueModel';
import IssueStatus from 'Frontend/generated/org/spring/framework/ai/vaadin/model/IssueStatus';
import {ViewConfig} from "@vaadin/hilla-file-router/types.js";

export const config: ViewConfig = {
  title: 'Voice Control',
  menu: {
    order: 4,
  },
};

export default function VoiceControlView() {
  const issues = useSignal<Issue[]>([]);
  const selectedIssue = useSignal<Issue | null>(null);

  const { field, model, submit, read, clear } = useForm(IssueModel, {
    onSubmit: async (issue: Issue) => {
      const updatedIssue = await IssuesService.update(issue);
      issues.value = issues.value.map(i =>
        i.id === updatedIssue.id ? updatedIssue : i
      );
    }
  });

  useEffect(() => {
    IssuesService.findAll().then(fetchedIssues => {
      issues.value = fetchedIssues;
    });
  }, []);

  const functions: VoiceFunction[] = useMemo(() => [
    {
      name: 'filterByAssignee',
      description: 'Filter issues by assignee name',
      parameters: {
        type: 'object',
        properties: {
          assignee: { type: 'string', description: 'Name of the assignee to filter by' },
        },
        required: ['assignee'],
      },
      execute: async ({ assignee }) => {
        issues.value = await IssuesService.findByAssignee(assignee);
      }
    },
    {
      name: 'showAllIssues',
      description: 'Show all issues without filtering',
      execute: async () => {
        issues.value = await IssuesService.findAll();
      }
    },
    {
      name: 'createNewIssue',
      description: 'Create a new issue',
      execute: () => {
        const newIssue = {
          id: 0,
          title: '',
          description: '',
          status: 'OPEN',
          assignee: ''
        } as Issue;
        selectedIssue.value = newIssue;
        read(newIssue);
      }
    },
    {
      name: 'deleteCurrentIssue',
      description: 'Delete the currently selected issue',
      execute: async () => {
        if (selectedIssue.value) {
          await IssuesService.delete(selectedIssue.value.id!);
          issues.value = issues.value.filter(i => i.id !== selectedIssue.value?.id);
          selectedIssue.value = null;
          clear();
        }
      }
    },
    {
      name: 'selectIssue',
      description: 'Select an issue by its ID number',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'The ID of the issue to select' },
        },
        required: ['id'],
      },
      execute: ({ id }) => {
        const issue = issues.value.find(i => i.id === id);
        if (issue) {
          selectedIssue.value = issue;
          read(issue);
        }
      }
    },
    {
      name: 'updateIssue',
      description: 'Update the currently selected issue with new values',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'New title for the issue' },
          description: { type: 'string', description: 'New description for the issue' },
          status: {
            type: 'string',
            description: 'New status for the issue',
            enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
          },
          assignee: { type: 'string', description: 'New assignee for the issue' }
        },
        minProperties: 1,
      },
      execute: async (args) => {
        if (selectedIssue.value) {
          const updates: Partial<Issue> = {};
          if (args.title) updates.title = args.title;
          if (args.description) updates.description = args.description;
          if (args.status) updates.status = args.status;
          if (args.assignee) updates.assignee = args.assignee;

          const updatedIssue = {
            ...selectedIssue.value,
            ...updates
          };
          read(updatedIssue);
          await submit();
        }
      }
    },
  ], [selectedIssue.value, issues.value, read, clear, submit]);

  return (
    <div className="p-m flex flex-col gap-m">
      <div className="flex gap-m items-center justify-between">
        <div className="flex gap-m items-center">
          <h2 className="m-0">Issues</h2>
          <Button theme="primary" onClick={() => functions.find(f => f.name === 'createNewIssue')?.execute({})}>
            Create New
          </Button>
        </div>

        <VoiceControl functions={functions} />

      </div>

      <Grid
        items={issues.value}
        selectedItems={selectedIssue.value ? [selectedIssue.value] : []}
        onActiveItemChanged={(e: CustomEvent) => {
          const selected = e.detail.value as Issue;
          selectedIssue.value = selected;
          read(selected);
        }}
      >
        <GridColumn path="id" header="ID" autoWidth/>
        <GridColumn path="title" header="Title" autoWidth/>
        <GridColumn path="description" header="Description" />
        <GridColumn path="status" header="Status" autoWidth/>
        <GridColumn path="assignee" header="Assignee" autoWidth/>
      </Grid>

      {selectedIssue.value && (
        <FormLayout>
          <TextField
            label="Title"
            {...field(model.title)}
          />
          <TextArea
            label="Description"
            {...field(model.description)}
          />
          <Select
            label="Status"
            items={Object.values(IssueStatus).map(status => ({ value: status, label: status.replace('_', ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase()) }))}
            {...field(model.status)}
          />
          <TextField
            label="Assignee"
            {...field(model.assignee)}
          />
          <div className="flex gap-m py-m">
            <Button theme="primary" onClick={submit}>
              {selectedIssue.value.id === 0 ? 'Create' : 'Update'}
            </Button>
            {selectedIssue.value.id !== 0 && (
              <Button
                theme="error"
                onClick={() => functions.find(f => f.name === 'deleteCurrentIssue')?.execute({})}
              >
                Delete
              </Button>
            )}
            <Button theme="tertiary" onClick={() => {
              selectedIssue.value = null;
              clear();
            }}>Cancel</Button>
          </div>
        </FormLayout>
      )}
    </div>
  );
}
