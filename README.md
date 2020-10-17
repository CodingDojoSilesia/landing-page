# landing-page

## howto run

just run index.html in serwer/browser. It can works locally without server

## params on URL

Example: `domain.com?start=12:00&end=14:00`

* start (format: `HH:MM:SS` or `HH:MM` or `HH`) - time of start. default is now
* time (format: INT) - total time of timer. default is 1 hour (this param doesn't have affect when end param is set)
* end (format: `HH:MM:SS` or `HH:MM` or `HH`) - time of end. default is start + time
* size (format: INT) - size of 1 block. Default is 15, size <10 can damage you RAM and CPU.
* cfg - background name. Backgrounds are: `logo`, `js`, `py`, `rainbow1`, `rainbow2`, `gogh`

## additional text field

On the bottom of site there is an editable textfield - you can put everything - links, wifi password and other useful informations for your event.
