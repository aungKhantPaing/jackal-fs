import dayjs from "dayjs";
import { filesize } from "filesize";

const formats = {
  dateTime(dateTime, format) {
    return dayjs(dateTime).format(format);
  },

  fileSize(bytes) {
    return filesize(bytes, {
      base: 2,
      standard: "jedec",
    });
  },
};

export default {
  install: (app) => {
    app.config.globalProperties.$formats = formats;
    app.provide("formats", formats);
  },
};
