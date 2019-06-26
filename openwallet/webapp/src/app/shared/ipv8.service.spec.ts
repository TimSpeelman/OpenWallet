import { TestBed, inject } from "@angular/core/testing";
import { IPv8Service } from "./ipv8.service";

describe("IPV8Service", () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [IPv8Service]
        });
    });

    it("should ...", inject([IPv8Service], (service: IPv8Service) => {
        expect(service).toBeTruthy();
    }));
});
