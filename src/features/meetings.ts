import { SlackApp, SlackEdgeAppEnv } from "slack-cloudflare-workers";
import * as Utils from "../Utils";
import type { Env } from "../index";

function getNewMeetingBlocks(withRepeat: boolean) {
	if (!withRepeat) {
		return `[{"type":"input","element":{"type":"plain_text_input","action_id":"name"},"label":{"type":"plain_text","text":"Name","emoji":true},"optional":false},{"type":"input","element":{"type":"datetimepicker","action_id":"time"},"label":{"type":"plain_text","text":"Time","emoji":true},"optional":false},{"type":"actions","elements":[{"type":"checkboxes","options":[{"text":{"type":"plain_text","text":":repeat: Repeat - once a week until given date","emoji":true},"value":"value-2"}],"action_id":"repeat"}]}]`;
	}
	return `[{"type":"input","element":{"type":"plain_text_input","action_id":"name"},"label":{"type":"plain_text","text":"Name","emoji":true},"optional":false},{"type":"input","element":{"type":"datetimepicker","action_id":"time"},"label":{"type":"plain_text","text":"Time","emoji":true},"optional":false},{"type":"actions","elements":[{"type":"checkboxes","initial_options":[{"value":"value-2","text":{"type":"plain_text","text":":repeat: Repeat - once a week until given date","emoji":true}}],"options":[{"text":{"type":"plain_text","text":":repeat: Repeat - once a week until given date","emoji":true},"value":"value-2"}],"action_id":"repeat"}]},{"type":"input","element":{"type":"datepicker","initial_date":"${Utils.getYYYYMMDD()}","placeholder":{"type":"plain_text","text":"Select a date","emoji":true},"action_id":"untilwhen"},"label":{"type":"plain_text","text":"Until when?","emoji":true},"optional":false}]`;
}

const meetings = async (slackApp: SlackApp<SlackEdgeAppEnv>, env: Env) => {
	slackApp.command("/newmeeting", async ({ context, payload }) => {
		try {
			const res = await context.client.views.open({
				trigger_id: payload.trigger_id,
				view: {
					callback_id: "new_meeting",
					type: "modal",
					submit: { type: "plain_text", text: "Submit", emoji: true },
					close: { type: "plain_text", text: "Cancel", emoji: true },
					title: {
						type: "plain_text",
						text: "Create a new meeting!",
						emoji: true,
					},
					blocks: getNewMeetingBlocks(false),
				},
			});
			console.log("res from opening view:" + JSON.stringify(res));
		} catch (error) {
			console.log(error);
		}
	});

	slackApp.viewSubmission(
		"new_meeting",
		async () => {
			return { response_action: "clear" };
		},
		async (req) => {
			try {
				const view = req.payload.view;
				const blocks = view.blocks;
				const values = view.state.values;

				let name: string = "";
				let time: number = -1;
				let repeat = null;
				let untilwhen = null;

				for (const block of blocks) {
					const block_id = block.block_id;
					let action_id;
					if (block.type === "input") {
						action_id = block.element.action_id;
					} else {
						action_id = block.elements[0].action_id;
					}
					switch (action_id) {
						case "name":
							name = values[block_id].name.value;
							break;
						case "time":
							time = values[block_id].time.selected_date_time;
							break;
						case "repeat":
							repeat = values[block_id].repeat.selected_options.length > 0;
							break;
						case "untilwhen":
							untilwhen = values[block_id].untilwhen.selected_date;
							break;
					}
				}

				console.log(
					`name: ${name}, time: ${time}, repeat: ${repeat}, untilwhen: ${untilwhen}`,
				);
				if (repeat && !untilwhen) {
					console.log("/newmeeting PARSING broke!");
					return;
				}

				// meeting (id INT, time INTEGER, name TEXT, description TEXT, yes TEXT, maybe TEXT, no TEXT)
				env.DB.prepare(
					"INSERT INTO meeting VALUES (1234, ?, ?, '', '[]', '[]', '[]');",
				)
					.bind(time, name)
					.run();

				if (repeat) {
					// TODO: add repeat logic
				}
			} catch (error) {
				console.log(error);
			}
		},
	);

	slackApp.action("repeat", async ({ payload }) => {
		try {
			const checked: boolean = payload.actions[0].selected_options.length > 0;
			await Utils.updateModal(
				payload,
				getNewMeetingBlocks(checked),
				env.SLACK_BOT_TOKEN,
			);
		} catch (error) {
			console.log(error);
		}
	});
};

export default meetings;
